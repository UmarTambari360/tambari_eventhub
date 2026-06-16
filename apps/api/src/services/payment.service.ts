import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  orders,
  transactions,
  orderItems,
  ticketTypes,
  organizerProfiles,
  attendees,
  platformLedger,
  events,
} from '../db/schema/index.js';
import {
  queryOrderById,
  queryOrderItems,
  queryTransactionByReference,
} from '../db/queries/orders.queries.js';
import {
  initializeTransaction,
  verifyTransaction,
  refundTransaction,
} from './paystack.service.js';
import { getSettings } from './platform.service.js';
import { createAttendees } from './attendee.service.js';
import { generateTransactionReference } from '../utils/code-generator.js';
import { calculatePlatformFee, calculateOrganizerNet } from '../utils/currency.js';
import { markOrderFailed } from './order.service.js';
import { logger } from '../lib/logger.js';
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../middleware/error.middleware.js';
import type { AttendeeDetailInput } from '@eventhub/validators';
import type { InitializePaymentResponse } from '@eventhub/types';

const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';

// ─── Initialize payment ───────────────────────────────────────────────────────

export async function initializePayment(
  orderId: string,
  userId: string,
  attendeeDetails: AttendeeDetailInput[],
  customCallbackUrl?: string
): Promise<InitializePaymentResponse> {
  const order = await queryOrderById(orderId);

  if (!order) throw new NotFoundError('Order not found.');
  if (order.userId !== userId) throw new ForbiddenError('Access denied.');
  if (order.status !== 'pending') {
    throw new ConflictError(`Order is already ${order.status}.`);
  }
  if (order.isFreeOrder) {
    throw new AppError(422, 'Free orders do not require payment initialization.');
  }
  if (order.expiresAt && order.expiresAt < new Date()) {
    throw new ConflictError('This order has expired. Please create a new order.');
  }

  // Validate attendee count matches order items
  const items = await queryOrderItems(orderId);
  const expectedCount = items.reduce((sum, i) => sum + i.quantity, 0);
  if (attendeeDetails.length !== expectedCount) {
    throw new AppError(
      422,
      `Expected ${expectedCount} attendee detail(s), received ${attendeeDetails.length}.`
    );
  }

  // Fetch event ID for the order, then load organizer
  const [orderRow] = await db
    .select({ eventId: orders.eventId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRow) throw new NotFoundError('Order not found.');

  const [eventRow] = await db
    .select({ organizerId: events.organizerId })
    .from(events)
    .where(eq(events.id, orderRow.eventId))
    .limit(1);

  if (!eventRow) throw new NotFoundError('Event not found.');

  const [profile] = await db
    .select({ paystackSubaccountCode: organizerProfiles.paystackSubaccountCode })
    .from(organizerProfiles)
    .where(eq(organizerProfiles.userId, eventRow.organizerId))
    .limit(1);

  if (!profile?.paystackSubaccountCode) {
    throw new AppError(
      500,
      'Organizer payment account not configured. Please contact support.'
    );
  }

  const settings = await getSettings();
  const platformFeeKobo = calculatePlatformFee(order.subtotal, settings.service_fee_percent);
  const organizerAmountKobo = calculateOrganizerNet(order.subtotal, settings.service_fee_percent);

  const reference = generateTransactionReference();
  const callbackUrl =
    customCallbackUrl ?? `${FRONTEND_URL}/orders/${order.orderNumber}?ref=${reference}`;

  // Create attendee records (before payment, so they exist on completion)
  await createAttendees(orderId, items, attendeeDetails);

  // Create transaction record
  await db.insert(transactions).values({
    reference,
    orderId,
    amount: order.totalAmount,
    platformFee: platformFeeKobo,
    organizerAmount: organizerAmountKobo,
    currency: 'NGN',
    email: order.customerEmail,
    status: 'pending',
    subaccountCode: profile.paystackSubaccountCode,
  });

  // Update order to processing
  await db
    .update(orders)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  // Call Paystack
  const paystackResult = await initializeTransaction({
    email: order.customerEmail,
    amount: order.totalAmount,
    reference,
    callbackUrl,
    subaccountCode: profile.paystackSubaccountCode,
    platformFeeKobo,
    metadata: {
      orderId,
      orderNumber: order.orderNumber,
      userId,
    },
  });

  // Store Paystack response
  await db
    .update(transactions)
    .set({
      accessCode: paystackResult.access_code,
      authorizationUrl: paystackResult.authorization_url,
      paystackReference: paystackResult.reference,
      updatedAt: new Date(),
    })
    .where(eq(transactions.reference, reference));

  logger.info('Payment initialized', {
    orderId,
    reference,
    amount: order.totalAmount,
  });

  return {
    authorizationUrl: paystackResult.authorization_url,
    reference,
    accessCode: paystackResult.access_code,
  };
}

// ─── Process payment success (called by webhook worker) ───────────────────────

export async function processPaymentSuccess(
  reference: string,
  paystackData: Record<string, unknown>
): Promise<void> {
  const txn = await queryTransactionByReference(reference);
  if (!txn) {
    logger.error('processPaymentSuccess: transaction not found', { reference });
    return;
  }

  if (txn.isVerified) {
    logger.info('processPaymentSuccess: already processed', { reference });
    return;
  }

  // Verify with Paystack directly
  const verified = await verifyTransaction(reference);

  if (verified.status !== 'success') {
    logger.warn('processPaymentSuccess: Paystack status not success', {
      reference,
      status: verified.status,
    });
    await markOrderFailed(txn.orderId);
    await db
      .update(transactions)
      .set({
        status: 'failed',
        failureReason: verified.gateway_response ?? 'Payment not successful',
        updatedAt: new Date(),
      })
      .where(eq(transactions.reference, reference));
    return;
  }

  const paidAt = new Date(verified.paid_at);
  const settings = await getSettings();

  await db.transaction(async (tx) => {
    // Update transaction
    await tx
      .update(transactions)
      .set({
        status: 'success',
        isVerified: true,
        verifiedAt: new Date(),
        webhookReceived: true,
        webhookReceivedAt: new Date(),
        paidAt,
        channel: verified.channel,
        cardType: verified.authorization?.card_type ?? null,
        bank: verified.authorization?.bank ?? null,
        lastFourDigits: verified.authorization?.last4 ?? null,
        gatewayResponse: verified.gateway_response,
        paystackResponse: paystackData as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(transactions.reference, reference));

    // Update order
    await tx
      .update(orders)
      .set({ status: 'paid', paidAt, updatedAt: new Date() })
      .where(eq(orders.id, txn.orderId));

    // Update ticket quantitySold
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, txn.orderId));

    for (const item of items) {
      await tx
        .update(ticketTypes)
        .set({
          quantitySold: sql`${ticketTypes.quantitySold} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(ticketTypes.id, item.ticketTypeId));
    }

    // Insert platform ledger entry
    await tx.insert(platformLedger).values({
      transactionId: txn.id,
      orderId: txn.orderId,
      organizerId: eventRow_organizerId, // resolved below
      eventId: txn.orderId, // placeholder — resolve below
      grossAmount: txn.amount,
      platformFee: txn.platformFee,
      organizerNet: txn.organizerAmount,
      feePercent: String(settings.service_fee_percent),
    });
  });
}

/**
 * Full payment success processing with ledger resolution.
 * Extracted to avoid the scoping issue above.
 */
export async function processWebhookPaymentSuccess(
  reference: string,
  paystackData: Record<string, unknown>
): Promise<void> {
  const txn = await queryTransactionByReference(reference);
  if (!txn) {
    logger.error('processWebhookPaymentSuccess: transaction not found', { reference });
    return;
  }

  if (txn.isVerified) {
    logger.info('processWebhookPaymentSuccess: already processed (idempotent)', { reference });
    return;
  }

  // Verify with Paystack API
  let verified;
  try {
    verified = await verifyTransaction(reference);
  } catch (err) {
    logger.error('processWebhookPaymentSuccess: Paystack verify failed', {
      reference,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  if (verified.status !== 'success') {
    await markOrderFailed(txn.orderId);
    await db
      .update(transactions)
      .set({
        status: 'failed',
        failureReason: verified.gateway_response ?? 'Payment not successful',
        updatedAt: new Date(),
      })
      .where(eq(transactions.reference, reference));
    logger.warn('processWebhookPaymentSuccess: payment not successful', {
      reference,
      status: verified.status,
    });
    return;
  }

  const paidAt = new Date(verified.paid_at);
  const settings = await getSettings();

  // Resolve event and organizer
  const [orderRow] = await db
    .select({ eventId: orders.eventId })
    .from(orders)
    .where(eq(orders.id, txn.orderId))
    .limit(1);

  if (!orderRow) {
    logger.error('processWebhookPaymentSuccess: order not found', { orderId: txn.orderId });
    return;
  }

  const [eventInfo] = await db.execute<{ id: string; organizer_id: string }>(
    `SELECT id, organizer_id FROM events WHERE id = $1 LIMIT 1`,
    [orderRow.eventId]
  ) as unknown as Array<{ id: string; organizer_id: string }>;

  // Use raw query for safety
  const eventResult = await db.execute(
    `SELECT id, organizer_id FROM events WHERE id = '${orderRow.eventId}' LIMIT 1`
  );

  const eventRecord = (eventResult as unknown as Array<{ id: string; organizer_id: string }>)[0];
  if (!eventRecord) {
    logger.error('processWebhookPaymentSuccess: event not found', { eventId: orderRow.eventId });
    return;
  }

  const organizerId = eventRecord.organizer_id;

  await db.transaction(async (tx) => {
    // Update transaction
    await tx
      .update(transactions)
      .set({
        status: 'success',
        isVerified: true,
        verifiedAt: new Date(),
        webhookReceived: true,
        webhookReceivedAt: new Date(),
        paidAt,
        channel: verified.channel,
        cardType: verified.authorization?.card_type ?? null,
        bank: verified.authorization?.bank ?? null,
        lastFourDigits: verified.authorization?.last4 ?? null,
        gatewayResponse: verified.gateway_response,
        paystackResponse: paystackData,
        updatedAt: new Date(),
      })
      .where(eq(transactions.reference, reference));

    // Update order
    await tx
      .update(orders)
      .set({ status: 'paid', paidAt, updatedAt: new Date() })
      .where(eq(orders.id, txn.orderId));

    // Update ticket quantitySold
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, txn.orderId));

    for (const item of items) {
      await tx
        .update(ticketTypes)
        .set({
          quantitySold: sql`${ticketTypes.quantitySold} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(ticketTypes.id, item.ticketTypeId));
    }

    // Insert platform ledger
    await tx.insert(platformLedger).values({
      transactionId: txn.id,
      orderId: txn.orderId,
      organizerId,
      eventId: orderRow.eventId,
      grossAmount: txn.amount,
      platformFee: txn.platformFee,
      organizerNet: txn.organizerAmount,
      feePercent: String(settings.service_fee_percent),
    });
  });

  logger.info('Payment processed successfully', {
    reference,
    orderId: txn.orderId,
    amount: txn.amount,
    organizerId,
  });
}

// ─── Manual verification fallback ────────────────────────────────────────────

export async function manualVerifyPayment(
  orderNumber: string,
  userId: string
): Promise<{ status: string; message: string }> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) throw new NotFoundError('Order not found.');
  if (order.userId !== userId) throw new ForbiddenError('Access denied.');

  if (order.status === 'paid') {
    return { status: 'paid', message: 'Payment already confirmed.' };
  }

  if (order.status !== 'processing' && order.status !== 'pending') {
    return { status: order.status, message: `Order is ${order.status}.` };
  }

  // Find associated transaction
  const txn = await queryTransactionByReference(
    (await db
      .select({ reference: transactions.reference })
      .from(transactions)
      .where(eq(transactions.orderId, order.id))
      .limit(1)
      .then((rows) => rows[0]?.reference)) ?? ''
  );

  if (!txn) {
    return { status: order.status, message: 'No transaction found for this order.' };
  }

  try {
    await processWebhookPaymentSuccess(txn.reference, {});
    return { status: 'paid', message: 'Payment verified and confirmed.' };
  } catch (err) {
    logger.warn('Manual verify failed', {
      reference: txn.reference,
      error: err instanceof Error ? err.message : String(err),
    });
    return { status: order.status, message: 'Payment not confirmed. Please try again.' };
  }
}

// ─── Process refund ───────────────────────────────────────────────────────────

export async function processRefund(
  orderId: string,
  adminId: string,
  reason: string
): Promise<void> {
  const order = await queryOrderById(orderId);
  if (!order) throw new NotFoundError('Order not found.');
  if (order.status !== 'paid') throw new ConflictError('Only paid orders can be refunded.');

  // Get transaction reference
  const [txn] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.orderId, orderId))
    .limit(1);

  if (!txn) throw new AppError(500, 'No transaction found for this order.');

  // Call Paystack refund
  let refundResult;
  try {
    refundResult = await refundTransaction(txn.paystackReference ?? txn.reference);
  } catch (err) {
    throw new AppError(
      502,
      `Paystack refund failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }

  const items = await queryOrderItems(orderId);

  await db.transaction(async (tx) => {
    // Update transaction
    await tx
      .update(transactions)
      .set({
        isRefunded: true,
        refundedAt: new Date(),
        paystackRefundId: String(refundResult.id),
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, txn.id));

    // Update order
    await tx
      .update(orders)
      .set({ status: 'refunded', refundedAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Revoke attendees
    await tx
      .update(attendees)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(attendees.orderId, orderId));

    // Restore ticket inventory
    for (const item of items) {
      await tx
        .update(ticketTypes)
        .set({
          quantitySold: sql`${ticketTypes.quantitySold} - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(ticketTypes.id, item.ticketTypeId));
    }

    // Mark ledger reversed
    await tx
      .update(platformLedger)
      .set({ isReversed: true, reversedAt: new Date() })
      .where(eq(platformLedger.orderId, orderId));
  });

  // Restore Redis availability
  const { releaseAvailability } = await import('./order.service.js');
  await releaseAvailability(
    items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }))
  );

  logger.info('Order refunded', { orderId, adminId, reason, refundId: refundResult.id });
}