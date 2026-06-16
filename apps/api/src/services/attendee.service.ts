import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  attendees,
  orderItems,
  events,
  orders,
} from '../db/schema/index.js';
import {
  queryAttendeeByTicketCode,
  queryOrderItems,
} from '../db/queries/orders.queries.js';
import { generateTicketCode } from '../utils/code-generator.js';
import { logger } from '../lib/logger.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../middleware/error.middleware.js';
import type { AttendeeDetailInput } from '@eventhub/validators';

// ─── Create attendees ─────────────────────────────────────────────────────────

/**
 * Creates one attendee record per ticket in the order.
 * attendeeDetails array is expected to be in the same order as
 * line items × quantity (i.e. for 2 GA + 1 VIP → 3 details in order: GA, GA, VIP).
 *
 * The caller validates that len(attendeeDetails) === sum(item.quantity).
 */
export async function createAttendees(
  orderId: string,
  items: Array<{
    id: string;
    ticketTypeId: string;
    quantity: number;
  }>,
  attendeeDetails: AttendeeDetailInput[]
): Promise<void> {
  // Build flat list of attendee records in item order
  const attendeeValues: Array<{
    orderId: string;
    orderItemId: string;
    eventId: string;
    ticketTypeId: string;
    ticketCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  }> = [];

  // Get eventId from order
  const [order] = await db
    .select({ eventId: orders.eventId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) throw new NotFoundError('Order not found.');

  let detailIndex = 0;

  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const detail = attendeeDetails[detailIndex];
      if (!detail) break;

      attendeeValues.push({
        orderId,
        orderItemId: item.id,
        eventId: order.eventId,
        ticketTypeId: item.ticketTypeId,
        ticketCode: generateTicketCode(),
        firstName: detail.firstName,
        lastName: detail.lastName,
        email: detail.email,
        phoneNumber: detail.phoneNumber || null,
      });

      detailIndex++;
    }
  }

  if (attendeeValues.length > 0) {
    await db.insert(attendees).values(attendeeValues);
    logger.info('Attendees created', {
      orderId,
      count: attendeeValues.length,
    });
  }
}

// ─── Create attendees for free orders ─────────────────────────────────────────

/**
 * For free orders, attendee details default to the purchaser's info.
 * Creates one attendee per ticket slot.
 */
export async function createFreeOrderAttendees(
  orderId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string | null
): Promise<void> {
  const items = await queryOrderItems(orderId);

  const [order] = await db
    .select({ eventId: orders.eventId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) throw new NotFoundError('Order not found.');

  const nameParts = customerName.trim().split(' ');
  const firstName = nameParts[0] ?? customerName;
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const attendeeValues = [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      attendeeValues.push({
        orderId,
        orderItemId: item.id,
        eventId: order.eventId,
        ticketTypeId: item.ticketTypeId,
        ticketCode: generateTicketCode(),
        firstName,
        lastName,
        email: customerEmail,
        phoneNumber: customerPhone,
      });
    }
  }

  if (attendeeValues.length > 0) {
    await db.insert(attendees).values(attendeeValues);
    logger.info('Free order attendees created', { orderId, count: attendeeValues.length });
  }
}

// ─── Check in ─────────────────────────────────────────────────────────────────

export async function checkInAttendee(
  ticketCode: string,
  checkedInBy: string,
  eventId: string
): Promise<{
  success: boolean;
  attendeeName: string;
  ticketType: string;
  message: string;
}> {
  const attendee = await queryAttendeeByTicketCode(ticketCode.toUpperCase());

  if (!attendee) {
    return {
      success: false,
      attendeeName: '',
      ticketType: '',
      message: 'Ticket not found. Please verify the ticket code.',
    };
  }

  if (attendee.eventId !== eventId) {
    return {
      success: false,
      attendeeName: `${attendee.firstName} ${attendee.lastName}`,
      ticketType: '',
      message: 'This ticket is for a different event.',
    };
  }

  if (attendee.isRevoked) {
    return {
      success: false,
      attendeeName: `${attendee.firstName} ${attendee.lastName}`,
      ticketType: '',
      message: `Ticket has been revoked: ${attendee.revokedReason ?? 'No reason given'}`,
    };
  }

  if (attendee.isCheckedIn) {
    return {
      success: false,
      attendeeName: `${attendee.firstName} ${attendee.lastName}`,
      ticketType: attendee.ticketTypeId,
      message: `Already checked in at ${attendee.checkedInAt?.toLocaleString('en-NG') ?? 'unknown time'}.`,
    };
  }

  await db
    .update(attendees)
    .set({
      isCheckedIn: true,
      checkedInAt: new Date(),
      checkedInBy,
      updatedAt: new Date(),
    })
    .where(eq(attendees.id, attendee.id));

  logger.info('Attendee checked in', {
    attendeeId: attendee.id,
    ticketCode,
    eventId,
    checkedInBy,
  });

  return {
    success: true,
    attendeeName: `${attendee.firstName} ${attendee.lastName}`,
    ticketType: attendee.ticketTypeId,
    message: 'Check-in successful!',
  };
}

// ─── Revoke ticket ────────────────────────────────────────────────────────────

export async function revokeTicket(
  attendeeId: string,
  reason: string,
  revokedBy: string
): Promise<void> {
  const [attendee] = await db
    .select()
    .from(attendees)
    .where(eq(attendees.id, attendeeId))
    .limit(1);

  if (!attendee) throw new NotFoundError('Attendee record not found.');
  if (attendee.isRevoked) throw new ConflictError('Ticket is already revoked.');

  await db
    .update(attendees)
    .set({
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(attendees.id, attendeeId));

  logger.info('Ticket revoked', { attendeeId, reason, revokedBy });
}

// ─── Update QR code ───────────────────────────────────────────────────────────

export async function updateAttendeeQrCode(
  attendeeId: string,
  qrCodeUrl: string,
  qrCodePublicId: string
): Promise<void> {
  await db
    .update(attendees)
    .set({ qrCodeUrl, qrCodePublicId, updatedAt: new Date() })
    .where(eq(attendees.id, attendeeId));
}