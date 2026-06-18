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
import { markOrderFailed, releaseAvailability } from './order.service.js';
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

// ─── Initialize Payment ─────────────────────────────────────────────────────

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

  // Validate attendee count
  const items = await queryOrderItems(orderId);
  const expectedCount = items.reduce((sum, i) => sum + i.quantity, 0);
  if (attendeeDetails.length !== expectedCount) {
    throw new AppError(
      422,
      `Expected ${expectedCount} attendee detail(s), received ${attendeeDetails.length}.`
    );
  }

  // Resolve organizer subaccount (critical for split payments)
  const organizerInfo = await db
    .select({
      organizerId: events.organizerId,
      subaccountCode: organizerProfiles.paystackSubaccountCode,
    })
    .from(orders)
    .innerJoin(events, eq(orders.eventId, events.id))
    .innerJoin(organizerProfiles, eq(events.organizerId, organizerProfiles.userId))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!organizerInfo[0]?.subaccountCode) {
    throw new AppError(
      500,
      'Organizer payment account not configured. Please contact support.'
    );
  }

  const { subaccountCode } = organizerInfo[0];

  const settings = await getSettings();
  const platformFeeKobo = calculatePlatformFee(order.subtotal, settings.service_fee_percent);
  const organizerAmountKobo = calculateOrganizerNet(order.subtotal, settings.service_fee_percent);

  const reference = generateTransactionReference();
  const callbackUrl =
    customCallbackUrl ?? `${FRONTEND_URL}/orders/${order.orderNumber}?ref=${reference}`;

  // Create attendees early (they exist even if payment fails)
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
    subaccountCode,
  });

  // Mark order as processing
  await db
    .update(orders)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  const paystackResult = await initializeTransaction({
    email: order.customerEmail,
    amount: order.totalAmount,
    reference,
    callbackUrl,
    subaccountCode,
    platformFeeKobo,
    metadata: { orderId, orderNumber: order.orderNumber, userId },
  });

  // Store Paystack details
  await db
    .update(transactions)
    .set({
      accessCode: paystackResult.access_code,
      authorizationUrl: paystackResult.authorization_url,
      paystackReference: paystackResult.reference,
      updatedAt: new Date(),
    })
    .where(eq(transactions.reference, reference));

  logger.info('Payment initialized', { orderId, reference, amount: order.totalAmount });

  return {
    authorizationUrl: paystackResult.authorization_url,
    reference,
    accessCode: paystackResult.access_code,
  };
}

// ─── Webhook / Success Handler (Source of Truth) ────────────────────────────

export async function processWebhookPaymentSuccess(
  reference: string,
  paystackData: Record<string, unknown>
): Promise<void> {
  const txn = await queryTransactionByReference(reference);
  if (!txn) {
    logger.error('Payment success: transaction not found', { reference });
    return;
  }

  if (txn.isVerified) {
    logger.info('Payment success: already processed (idempotent)', { reference });
    return;
  }

  let verified;
  try {
    verified = await verifyTransaction(reference);
  } catch (err) {
    logger.error('Paystack verification failed', {
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
    return;
  }

  const paidAt = new Date(verified.paid_at);
  const settings = await getSettings();

  // Resolve event + organizer (clean join)
  const [orderWithEvent] = await db
    .select({
      eventId: orders.eventId,
      organizerId: events.organizerId,
    })
    .from(orders)
    .innerJoin(events, eq(orders.eventId, events.id))
    .where(eq(orders.id, txn.orderId))
    .limit(1);

  if (!orderWithEvent) {
    logger.error('Order or event not found during payment success', { orderId: txn.orderId });
    return;
  }

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

    // Increment ticket quantities sold
    const items = await tx
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

    // Record platform ledger
    await tx.insert(platformLedger).values({
      transactionId: txn.id,
      orderId: txn.orderId,
      organizerId: orderWithEvent.organizerId,
      eventId: orderWithEvent.eventId,
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
    organizerId: orderWithEvent.organizerId,
  });
}

// ─── Manual Verification Fallback ───────────────────────────────────────────

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

  const [txnRow] = await db
    .select({ reference: transactions.reference })
    .from(transactions)
    .where(eq(transactions.orderId, order.id))
    .limit(1);

  if (!txnRow?.reference) {
    return { status: order.status, message: 'No transaction found for this order.' };
  }

  try {
    await processWebhookPaymentSuccess(txnRow.reference, {});
    return { status: 'paid', message: 'Payment verified and confirmed.' };
  } catch (err) {
    logger.warn('Manual verify failed', {
      reference: txnRow.reference,
      error: err instanceof Error ? err.message : String(err),
    });
    return { status: order.status, message: 'Payment not confirmed. Please try again.' };
  }
}

// ─── Refund ─────────────────────────────────────────────────────────────────

export async function processRefund(
  orderId: string,
  adminId: string,
  reason: string
): Promise<void> {
  const order = await queryOrderById(orderId);
  if (!order) throw new NotFoundError('Order not found.');
  if (order.status !== 'paid') throw new ConflictError('Only paid orders can be refunded.');

  const [txn] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.orderId, orderId))
    .limit(1);

  if (!txn) throw new AppError(500, 'No transaction found for this order.');

  const refundResult = await refundTransaction(txn.paystackReference ?? txn.reference);

  const items = await queryOrderItems(orderId);

  await db.transaction(async (tx) => {
    await tx
      .update(transactions)
      .set({
        isRefunded: true,
        refundedAt: new Date(),
        paystackRefundId: String(refundResult.id),
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, txn.id));

    await tx
      .update(orders)
      .set({ status: 'refunded', refundedAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    await tx
      .update(attendees)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(attendees.orderId, orderId));

    for (const item of items) {
      await tx
        .update(ticketTypes)
        .set({
          quantitySold: sql`${ticketTypes.quantitySold} - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(ticketTypes.id, item.ticketTypeId));
    }

    await tx
      .update(platformLedger)
      .set({ isReversed: true, reversedAt: new Date() })
      .where(eq(platformLedger.orderId, orderId));
  });

  await releaseAvailability(
    items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }))
  );

  logger.info('Order refunded', { orderId, adminId, reason, refundId: refundResult.id });
}