import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  orders,
  orderItems,
  attendees,
  ticketTypes,
  events,
  platformLedger,
} from '../db/schema/index.js';
import {
  queryOrderById,
  queryOrderWithDetails,
  queryOrderByNumberWithDetails,
  queryOrderItems,
  queryOrderAttendees,
  queryUserOrders,
  queryTicketTypesByIds,
} from '../db/queries/orders.queries.js';
import { generateOrderNumber } from '../utils/code-generator.js';
import { calculatePlatformFee } from '../utils/currency.js';
import { getSettings } from './platform.service.js';
import { getRedis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../middleware/error.middleware.js';
import type { CreateOrderInput } from '@eventhub/validators';
import type { OrderDTO, OrderListItemDTO, OrderStatus } from '@eventhub/types';

// ─── Availability helpers ─────────────────────────────────────────────────────

/**
 * Atomically decrement Redis availability counters for a set of ticket types.
 * If any counter would go below 0, rolls back ALL decrements and throws.
 * Used for PAID events only — free events use DB directly.
 */
async function decrementAvailability(
  items: Array<{ ticketTypeId: string; quantity: number }>
): Promise<void> {
  const redis = getRedis();
  const keys = items.map((i) => `ticket:${i.ticketTypeId}:available`);

  const luaScript = `
    local results = {}
    for i, key in ipairs(KEYS) do
      local qty = tonumber(ARGV[i])
      local current = tonumber(redis.call('GET', key))
      if current == nil then
        results[i] = 1
      elseif current < qty then
        for j = 1, i - 1 do
          redis.call('INCRBY', KEYS[j], tonumber(ARGV[j]))
        end
        return -1
      else
        redis.call('DECRBY', key, qty)
        results[i] = current - qty
      end
    end
    return 1
  `;

  const quantities = items.map((i) => String(i.quantity));

  try {
    const result = await redis.eval(
      luaScript,
      keys.length,
      ...keys,
      ...quantities
    ) as number;

    if (result === -1) {
      throw new ConflictError(
        'Some tickets are no longer available. Please refresh and try again.'
      );
    }
  } catch (err) {
    if (err instanceof ConflictError) throw err;
    logger.warn('Redis availability check failed, falling back to DB check', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Release Redis availability counters (on order expiry or payment failure).
 */
export async function releaseAvailability(
  items: Array<{ ticketTypeId: string; quantity: number }>
): Promise<void> {
  const redis = getRedis();
  const pipeline = redis.pipeline();
  for (const item of items) {
    pipeline.incrby(`ticket:${item.ticketTypeId}:available`, item.quantity);
  }
  try {
    await pipeline.exec();
  } catch (err) {
    logger.warn('Failed to release Redis availability', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ─── Shape helpers ────────────────────────────────────────────────────────────

/**
 * Builds a complete OrderDTO with items and attendees.
 * This is the single source of truth for full order details.
 */
async function buildOrderDTO(orderId: string): Promise<OrderDTO | null> {
  const row = await queryOrderWithDetails(orderId);
  if (!row) return null;

  const [items, orderAttendees] = await Promise.all([
    queryOrderItems(orderId),
    queryOrderAttendees(orderId),
  ]);

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status as OrderStatus,
    isFreeOrder: row.isFreeOrder,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    subtotal: row.subtotal,
    serviceFee: row.serviceFee,
    totalAmount: row.totalAmount,
    notes: row.notes,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    refundedAt: row.refundedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    event: {
      id: row.eventId,
      title: row.eventTitle,
      slug: row.eventSlug,
      venue: row.eventVenue,
      location: row.eventLocation,
      eventDate: row.eventDate.toISOString(),
      bannerImageUrl: row.eventBannerUrl,
      thumbnailUrl: row.eventThumbnailUrl,
      organizer: {
        id: row.eventOrganizerId,
        fullName: row.organizerFullName ?? '',
        businessName: row.organizerBusinessName ?? null,
      },
    },
    items: items.map((i) => ({
      id: i.id,
      ticketTypeId: i.ticketTypeId,
      ticketTypeName: i.ticketTypeName,
      pricePerTicket: i.pricePerTicket,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
    attendees: orderAttendees.map((a) => ({
      id: a.id,
      ticketCode: a.ticketCode,
      ticketTypeName: a.ticketTypeName ?? '',
      firstName: a.firstName,
      lastName: a.lastName,
      email: a.email,
      phoneNumber: a.phoneNumber,
      isCheckedIn: a.isCheckedIn,
      checkedInAt: a.checkedInAt?.toISOString() ?? null,
      isRevoked: a.isRevoked,
      revokedAt: a.revokedAt?.toISOString() ?? null,
      revokedReason: a.revokedReason,
      qrCodeUrl: a.qrCodeUrl,
      eventId: a.eventId,
      orderId: a.orderId,
    })),
  };
}

// ─── Create order ─────────────────────────────────────────────────────────────

export async function createOrder(
  userId: string,
  userFullName: string,
  userEmail: string,
  userPhone: string | null,
  input: CreateOrderInput
): Promise<{
  eventId: string;
  orderId: string;
  orderNumber: string;
  isFreeOrder: boolean;
  totalAmount: number;
  expiresAt: string | null;
}> {
  // Load event
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, input.eventId))
    .limit(1);

  if (!event) throw new NotFoundError('Event not found.');
  if (!event.isPublished) throw new ConflictError('This event is not available for booking.');
  if (event.isCancelled) throw new ConflictError('This event has been cancelled.');

  // Load and validate ticket types
  const ticketTypeIds = input.items.map((i) => i.ticketTypeId);
  const ticketTypeRows = await queryTicketTypesByIds(ticketTypeIds);

  const typeMap = new Map(ticketTypeRows.map((t) => [t.id, t]));

  for (const item of input.items) {
    const tt = typeMap.get(item.ticketTypeId);
    if (!tt) throw new NotFoundError(`Ticket type not found: ${item.ticketTypeId}`);
    if (tt.eventId !== input.eventId) throw new AppError(422, 'Ticket type does not belong to this event.');
    if (!tt.isActive) throw new ConflictError(`Ticket type "${tt.name}" is no longer available.`);
    if (item.quantity < tt.minPurchase) {
      throw new AppError(422, `Minimum purchase for "${tt.name}" is ${tt.minPurchase}.`);
    }
    if (item.quantity > tt.maxPurchase) {
      throw new AppError(422, `Maximum purchase for "${tt.name}" is ${tt.maxPurchase}.`);
    }

    const available = tt.quantity - tt.quantitySold;
    if (available < item.quantity) {
      throw new ConflictError(`Only ${available} ticket(s) remaining for "${tt.name}".`);
    }

    const now = new Date();
    if (tt.saleStartDate && tt.saleStartDate > now) {
      throw new ConflictError(`Ticket sales for "${tt.name}" have not started yet.`);
    }
    if (tt.saleEndDate && tt.saleEndDate < now) {
      throw new ConflictError(`Ticket sales for "${tt.name}" have ended.`);
    }
  }

  // Compute totals
  const settings = await getSettings();
  let subtotal = 0;
  const lineItems = input.items.map((item) => {
    const tt = typeMap.get(item.ticketTypeId)!;
    const lineSubtotal = tt.price * item.quantity;
    subtotal += lineSubtotal;
    return {
      ticketTypeId: tt.id,
      ticketTypeName: tt.name,
      pricePerTicket: tt.price,
      quantity: item.quantity,
      subtotal: lineSubtotal,
    };
  });

  const isFreeOrder = subtotal === 0;
  const serviceFee = isFreeOrder ? 0 : calculatePlatformFee(subtotal, settings.service_fee_percent);
  const totalAmount = subtotal + serviceFee;
  const orderNumber = generateOrderNumber();
  const expiresAt = isFreeOrder ? null : new Date(Date.now() + 30 * 60 * 1000);

  if (!isFreeOrder) {
    await decrementAvailability(
      input.items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }))
    );
  }

  let orderId: string;
  try {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId,
          eventId: input.eventId,
          customerName: userFullName,
          customerEmail: userEmail,
          customerPhone: userPhone,
          subtotal,
          serviceFee,
          totalAmount,
          isFreeOrder,
          status: 'pending',
          expiresAt,
        })
        .returning({ id: orders.id });

      if (!order) throw new Error('Failed to create order');

      await tx.insert(orderItems).values(
        lineItems.map((li) => ({
          orderId: order.id,
          ticketTypeId: li.ticketTypeId,
          ticketTypeName: li.ticketTypeName,
          pricePerTicket: li.pricePerTicket,
          quantity: li.quantity,
          subtotal: li.subtotal,
        }))
      );

      return order;
    });

    orderId = result.id;
  } catch (err) {
    if (!isFreeOrder) {
      await releaseAvailability(
        input.items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }))
      );
    }
    throw err;
  }

  logger.info('Order created', {
    orderId,
    orderNumber,
    userId,
    eventId: input.eventId,
    isFreeOrder,
    totalAmount,
  });

  return {
    eventId: input.eventId,
    orderId,
    orderNumber,
    isFreeOrder,
    totalAmount,
    expiresAt: expiresAt?.toISOString() ?? null,
  };
}

// ─── Get order ────────────────────────────────────────────────────────────────

export async function getOrderByNumber(
  orderNumber: string,
  userId: string
): Promise<OrderDTO> {
  const row = await queryOrderByNumberWithDetails(orderNumber);

  if (!row) throw new NotFoundError('Order not found.');
  if (row.userId !== userId) throw new ForbiddenError('Access denied.');

  const dto = await buildOrderDTO(row.id);
  if (!dto) throw new NotFoundError('Order not found.');

  return dto;
}

export async function getUserOrders(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ items: OrderListItemDTO[]; total: number; page: number; limit: number; totalPages: number }> {
  const rows = await queryUserOrders(userId, page, limit);

  const orderIds = rows.map((r) => r.id);
  let itemCountMap = new Map<string, number>();

  if (orderIds.length > 0) {
    const itemRows = await db
      .select({
        orderId: orderItems.orderId,
        totalQuantity: sql<number>`sum(${orderItems.quantity})`,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderIds[0]!)) // TODO: Phase 9 — use inArray for multiple
      .groupBy(orderItems.orderId);

    itemCountMap = new Map(itemRows.map((i) => [i.orderId, i.totalQuantity]));
  }

  const items: OrderListItemDTO[] = rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    status: r.status as OrderStatus,
    isFreeOrder: r.isFreeOrder,
    totalAmount: r.totalAmount,
    createdAt: r.createdAt.toISOString(),
    paidAt: r.paidAt?.toISOString() ?? null,
    event: {
      id: r.eventId,
      title: r.eventTitle,
      slug: r.eventSlug,
      eventDate: r.eventDate.toISOString(),
      thumbnailUrl: r.eventThumbnailUrl,
    },
    itemCount: itemCountMap.get(r.id) ?? 0,
  }));

  return {
    items,
    total: rows.length, // TODO: Phase 9 — proper COUNT with pagination
    page,
    limit,
    totalPages: 1, // Placeholder
  };
}

// ─── Other methods (unchanged) ────────────────────────────────────────────────

export async function expireOrder(orderId: string): Promise<void> {
  const order = await queryOrderById(orderId);
  if (!order) {
    logger.warn('expireOrder: order not found', { orderId });
    return;
  }

  if (order.status !== 'pending') {
    logger.info('expireOrder: order no longer pending, skipping', {
      orderId,
      status: order.status,
    });
    return;
  }

  const items = await queryOrderItems(orderId);

  await db
    .update(orders)
    .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, 'pending')));

  await releaseAvailability(
    items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }))
  );

  logger.info('Order expired', { orderId });
}

export async function markOrderPaid(orderId: string, paidAt: Date): Promise<void> {
  await db
    .update(orders)
    .set({ status: 'paid', paidAt, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function markOrderFailed(orderId: string): Promise<void> {
  const order = await queryOrderById(orderId);
  if (!order || order.status !== 'pending') return;

  const items = await queryOrderItems(orderId);

  await db
    .update(orders)
    .set({ status: 'failed', updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await releaseAvailability(
    items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }))
  );

  logger.info('Order marked failed', { orderId });
}

export async function refundOrder(orderId: string, adminId: string): Promise<void> {
  const order = await queryOrderById(orderId);
  if (!order) throw new NotFoundError('Order not found.');
  if (order.status !== 'paid') {
    throw new ConflictError('Only paid orders can be refunded.');
  }

  const items = await queryOrderItems(orderId);

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: 'refunded', refundedAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    await tx
      .update(attendees)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Order refunded',
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
  
  logger.info('Order refunded', { orderId, adminId });
}