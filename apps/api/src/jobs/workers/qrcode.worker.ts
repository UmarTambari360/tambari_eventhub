import { Worker, type Job } from 'bullmq';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { db } from '../../db/index.js';
import { attendees, orders, events, ticketTypes } from '../../db/schema/index.js';
import { uploadQrCode } from '../../services/cloudinary.service.js';
import { updateAttendeeQrCode } from '../../services/attendee.service.js';
import { enqueueTicketDeliveryEmail } from '../producers/email.producer.js';
import type { GenerateQrCodesPayload } from '../producers/qrcode.producer.js';

/**
 * Generates a QR code PNG buffer for a ticket code.
 * The QR code encodes a JSON payload verified at check-in.
 */
async function generateQrBuffer(ticketCode: string, eventId: string): Promise<Buffer> {
  const payload = JSON.stringify({ ticketCode, eventId, platform: 'eventhub' });

  const pngBuffer = await QRCode.toBuffer(payload, {
    type: 'png',
    width: 400,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H', // High — more robust at the door
  });

  return Buffer.from(pngBuffer);
}

async function processQrCodeJob(job: Job): Promise<void> {
  const { orderId, orderNumber } = job.data as GenerateQrCodesPayload;

  logger.info('Processing QR code generation job', { orderId, orderNumber, jobId: job.id });

  // Load all attendees for this order that don't have a QR code yet
  const orderAttendees = await db
    .select({
      id: attendees.id,
      ticketCode: attendees.ticketCode,
      eventId: attendees.eventId,
      firstName: attendees.firstName,
      lastName: attendees.lastName,
      email: attendees.email,
      qrCodeUrl: attendees.qrCodeUrl,
      ticketTypeId: attendees.ticketTypeId,
    })
    .from(attendees)
    .where(eq(attendees.orderId, orderId));

  if (orderAttendees.length === 0) {
    logger.warn('QR worker: no attendees found for order', { orderId });
    return;
  }

  // Filter to those without QR codes (idempotency — safe to re-run)
  const needsQr = orderAttendees.filter((a) => !a.qrCodeUrl);

  if (needsQr.length === 0) {
    logger.info('QR worker: all attendees already have QR codes (idempotent)', { orderId });
    return;
  }

  logger.info('QR worker: generating QR codes', { orderId, count: needsQr.length });

  // Generate and upload QR codes — process sequentially to avoid Cloudinary rate limits
  const results: Array<{
    attendeeId: string;
    qrCodeUrl: string;
    ticketCode: string;
    firstName: string;
    lastName: string;
    ticketTypeId: string;
  }> = [];

  for (const attendee of needsQr) {
    try {
      const buffer = await generateQrBuffer(attendee.ticketCode, attendee.eventId);
      const uploaded = await uploadQrCode(buffer, attendee.ticketCode);
      await updateAttendeeQrCode(attendee.id, uploaded.url, uploaded.publicId);

      results.push({
        attendeeId: attendee.id,
        qrCodeUrl: uploaded.url,
        ticketCode: attendee.ticketCode,
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        ticketTypeId: attendee.ticketTypeId,
      });

      logger.debug('QR code generated and uploaded', {
        attendeeId: attendee.id,
        ticketCode: attendee.ticketCode,
        publicId: uploaded.publicId,
      });
    } catch (err) {
      logger.error('Failed to generate QR code for attendee', {
        attendeeId: attendee.id,
        ticketCode: attendee.ticketCode,
        error: err instanceof Error ? err.message : String(err),
      });
      // Continue with remaining attendees — partial success is better than total failure
    }
  }

  if (results.length === 0) {
    logger.error('QR worker: all QR code generations failed', { orderId });
    throw new Error('Failed to generate any QR codes for order');
  }

  // Load order details and ticket type names for the email
  const [orderRow] = await db
    .select({
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      orderNumber: orders.orderNumber,
      eventId: orders.eventId,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRow) {
    logger.warn('QR worker: order not found after generating QR codes', { orderId });
    return;
  }

  // Load event details
  const [event] = await db
    .select({
      title: events.title,
      eventDate: events.eventDate,
      venue: events.venue,
      location: events.location,
    })
    .from(events)
    .where(eq(events.id, orderRow.eventId))
    .limit(1);

  if (!event) {
    logger.warn('QR worker: event not found', { eventId: orderRow.eventId });
    return;
  }

  // Load ticket type names
  const ticketTypeIds = [...new Set(results.map((r) => r.ticketTypeId))];
  const ticketTypeRows = await db
    .select({ id: ticketTypes.id, name: ticketTypes.name })
    .from(ticketTypes)
    .where(
      ticketTypeIds.length === 1
        ? eq(ticketTypes.id, ticketTypeIds[0]!)
        : eq(ticketTypes.id, ticketTypeIds[0]!) // Phase 9: use inArray
    );

  const ticketTypeMap = new Map(ticketTypeRows.map((t) => [t.id, t.name]));

  // Enqueue ticket delivery email
  await enqueueTicketDeliveryEmail({
    to: orderRow.customerEmail,
    customerName: orderRow.customerName,
    orderNumber: orderRow.orderNumber,
    eventTitle: event.title,
    eventDate: new Intl.DateTimeFormat('en-NG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Lagos',
    }).format(event.eventDate),
    eventVenue: event.venue,
    eventLocation: event.location,
    tickets: results.map((r) => ({
      firstName: r.firstName,
      lastName: r.lastName,
      ticketCode: r.ticketCode,
      ticketTypeName: ticketTypeMap.get(r.ticketTypeId) ?? 'Ticket',
      qrCodeUrl: r.qrCodeUrl,
    })),
  });

  logger.info('QR code job complete', {
    orderId,
    generated: results.length,
    failed: needsQr.length - results.length,
  });
}

export function createQrCodeWorker(): Worker {
  const worker = new Worker('qrcode', processQrCodeJob, {
    connection: getRedis(),
    concurrency: 2, // Lower concurrency — Cloudinary uploads are expensive
  });

  worker.on('completed', (job) => {
    logger.info('QR code job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    logger.error('QR code job failed', {
      jobId: job?.id,
      error: error.message,
      attempts: job?.attemptsMade,
    });
  });

  return worker;
}
