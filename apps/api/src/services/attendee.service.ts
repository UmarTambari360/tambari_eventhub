import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  attendees,
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
  ConflictError,
} from '../middleware/error.middleware.js';
import type { AttendeeDetailInput } from '@eventhub/validators';

// INTERNAL HELPERS 

async function getOrderEventId(orderId: string): Promise<string> {
  const [order] = await db
    .select({ eventId: orders.eventId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new NotFoundError('Order not found.');
  }

  return order.eventId;
}

/**
 * Builds a flat list of attendee records from order items + details.
 * Ensures correct mapping for multi-ticket orders.
 */
function buildAttendeeValues(
  orderId: string,
  items: Array<{ id: string; ticketTypeId: string; quantity: number }>,
  attendeeDetails: AttendeeDetailInput[],
  eventId: string,
  defaultFirstName?: string,
  defaultLastName?: string,
  defaultEmail?: string,
  defaultPhone?: string | null
): Array<{
  orderId: string;
  orderItemId: string;
  eventId: string;
  ticketTypeId: string;
  ticketCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}> {
  const attendeeValues: any[] = [];
  let detailIndex = 0;

  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const detail = attendeeDetails?.[detailIndex];

      attendeeValues.push({
        orderId,
        orderItemId: item.id,
        eventId,
        ticketTypeId: item.ticketTypeId,
        ticketCode: generateTicketCode(),
        firstName: detail?.firstName ?? defaultFirstName ?? '',
        lastName: detail?.lastName ?? defaultLastName ?? '',
        email: detail?.email ?? defaultEmail ?? '',
        phoneNumber: detail?.phoneNumber ?? defaultPhone ?? null,
      });

      detailIndex++;
    }
  }

  return attendeeValues;
}

async function getAttendeeById(attendeeId: string) {
  const [attendee] = await db
    .select()
    .from(attendees)
    .where(eq(attendees.id, attendeeId))
    .limit(1);

  if (!attendee) {
    throw new NotFoundError('Attendee record not found.');
  }

  return attendee;
}

// PUBLIC SERVICE FUNCTIONS

/**
 * Creates one attendee record per ticket in the order.
 * attendeeDetails array must match the total quantity across items.
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
  const eventId = await getOrderEventId(orderId);

  const attendeeValues = buildAttendeeValues(
    orderId,
    items,
    attendeeDetails,
    eventId
  );

  if (attendeeValues.length > 0) {
    await db.insert(attendees).values(attendeeValues);
    logger.info('Attendees created', {
      orderId,
      count: attendeeValues.length,
    });
  }
}

// For free orders, attendee details default to the purchaser's info.
export async function createFreeOrderAttendees(
  orderId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string | null
): Promise<void> {
  const items = await queryOrderItems(orderId);
  const eventId = await getOrderEventId(orderId);

  const nameParts = customerName.trim().split(' ');
  const firstName = nameParts[0] ?? customerName;
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const attendeeValues = buildAttendeeValues(
    orderId,
    items,
    [], // no custom details for free orders
    eventId,
    firstName,
    lastName,
    customerEmail,
    customerPhone
  );

  if (attendeeValues.length > 0) {
    await db.insert(attendees).values(attendeeValues);
    logger.info('Free order attendees created', {
      orderId,
      count: attendeeValues.length,
    });
  }
}

// Check in

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

// Revoke ticket 

export async function revokeTicket(
  attendeeId: string,
  reason: string,
  revokedBy: string
): Promise<void> {
  const attendee = await getAttendeeById(attendeeId);

  if (attendee.isRevoked) {
    throw new ConflictError('Ticket is already revoked.');
  }

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

// Update QR code

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