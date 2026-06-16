import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../index.js';
import {
  orders,
  orderItems,
  attendees,
  events,
  users,
  organizerProfiles,
  ticketTypes,
  transactions,
} from '../schema/index.js';

// ─── Order detail (full) ──────────────────────────────────────────────────────

export async function queryOrderById(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return order ?? null;
}

export async function queryOrderByNumber(orderNumber: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  return order ?? null;
}

export async function queryOrderWithDetails(orderId: string) {
  const [order] = await db
    .select({
      // Order fields
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      isFreeOrder: orders.isFreeOrder,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      subtotal: orders.subtotal,
      serviceFee: orders.serviceFee,
      totalAmount: orders.totalAmount,
      notes: orders.notes,
      expiresAt: orders.expiresAt,
      paidAt: orders.paidAt,
      cancelledAt: orders.cancelledAt,
      refundedAt: orders.refundedAt,
      userId: orders.userId,
      eventId: orders.eventId,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      // Event fields
      eventTitle: events.title,
      eventSlug: events.slug,
      eventVenue: events.venue,
      eventLocation: events.location,
      eventDate: events.eventDate,
      eventBannerUrl: events.bannerImageUrl,
      eventThumbnailUrl: events.thumbnailUrl,
      eventOrganizerId: events.organizerId,
      // Organizer
      organizerFullName: users.fullName,
      organizerBusinessName: organizerProfiles.businessName,
    })
    .from(orders)
    .innerJoin(events, eq(orders.eventId, events.id))
    .leftJoin(users, eq(events.organizerId, users.id))
    .leftJoin(organizerProfiles, eq(events.organizerId, organizerProfiles.userId))
    .where(eq(orders.id, orderId))
    .limit(1);

  return order ?? null;
}

export async function queryOrderByNumberWithDetails(orderNumber: string) {
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      isFreeOrder: orders.isFreeOrder,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      subtotal: orders.subtotal,
      serviceFee: orders.serviceFee,
      totalAmount: orders.totalAmount,
      notes: orders.notes,
      expiresAt: orders.expiresAt,
      paidAt: orders.paidAt,
      cancelledAt: orders.cancelledAt,
      refundedAt: orders.refundedAt,
      userId: orders.userId,
      eventId: orders.eventId,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      eventTitle: events.title,
      eventSlug: events.slug,
      eventVenue: events.venue,
      eventLocation: events.location,
      eventDate: events.eventDate,
      eventBannerUrl: events.bannerImageUrl,
      eventThumbnailUrl: events.thumbnailUrl,
      eventOrganizerId: events.organizerId,
      organizerFullName: users.fullName,
      organizerBusinessName: organizerProfiles.businessName,
    })
    .from(orders)
    .innerJoin(events, eq(orders.eventId, events.id))
    .leftJoin(users, eq(events.organizerId, users.id))
    .leftJoin(organizerProfiles, eq(events.organizerId, organizerProfiles.userId))
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  return order ?? null;
}

export async function queryOrderItems(orderId: string) {
  return db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
}

export async function queryOrderAttendees(orderId: string) {
  return db
    .select({
      id: attendees.id,
      ticketCode: attendees.ticketCode,
      firstName: attendees.firstName,
      lastName: attendees.lastName,
      email: attendees.email,
      phoneNumber: attendees.phoneNumber,
      isCheckedIn: attendees.isCheckedIn,
      checkedInAt: attendees.checkedInAt,
      isRevoked: attendees.isRevoked,
      revokedAt: attendees.revokedAt,
      revokedReason: attendees.revokedReason,
      qrCodeUrl: attendees.qrCodeUrl,
      eventId: attendees.eventId,
      orderId: attendees.orderId,
      orderItemId: attendees.orderItemId,
      ticketTypeId: attendees.ticketTypeId,
      ticketTypeName: ticketTypes.name,
    })
    .from(attendees)
    .leftJoin(ticketTypes, eq(attendees.ticketTypeId, ticketTypes.id))
    .where(eq(attendees.orderId, orderId));
}

export async function queryUserOrders(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      isFreeOrder: orders.isFreeOrder,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
      eventId: events.id,
      eventTitle: events.title,
      eventSlug: events.slug,
      eventDate: events.eventDate,
      eventThumbnailUrl: events.thumbnailUrl,
    })
    .from(orders)
    .innerJoin(events, eq(orders.eventId, events.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function queryTransactionByOrderId(orderId: string) {
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.orderId, orderId))
    .limit(1);
  return tx ?? null;
}

export async function queryTransactionByReference(reference: string) {
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.reference, reference))
    .limit(1);
  return tx ?? null;
}

export async function queryAttendeeByTicketCode(ticketCode: string) {
  const [attendee] = await db
    .select()
    .from(attendees)
    .where(eq(attendees.ticketCode, ticketCode))
    .limit(1);
  return attendee ?? null;
}

export async function queryAttendeesByOrderIds(orderIds: string[]) {
  if (orderIds.length === 0) return [];
  return db
    .select()
    .from(attendees)
    .where(inArray(attendees.orderId, orderIds));
}

export async function queryTicketTypesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(ticketTypes)
    .where(inArray(ticketTypes.id, ids));
}