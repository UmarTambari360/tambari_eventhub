import { Worker, type Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { db } from '../../db/index.js';
import {
  attendees,
  orders,
  events,
  ticketTypes,
} from '../../db/schema/index.js';
import { uploadBuffer } from '../../services/cloudinary.service.js';
import { EXPORT_JOBS } from '../queues.js';
import type {
  AttendeesExportPayload,
  OrdersExportPayload,
} from '../producers/export.producer.js';

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(fields: Array<string | number | boolean | null | undefined>): string {
  return fields.map(escapeCsv).join(',');
}

function buildCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const lines = [headers.join(','), ...rows.map(rowToCsv)];
  return lines.join('\n');
}

// ─── Attendees CSV ────────────────────────────────────────────────────────────

async function generateAttendeesExport(eventId: string, organizerId: string): Promise<Buffer> {
  // Verify ownership
  const [event] = await db
    .select({ title: events.title, organizerId: events.organizerId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || event.organizerId !== organizerId) {
    throw new Error('Event not found or access denied.');
  }

  const rows = await db
    .select({
      ticketCode: attendees.ticketCode,
      firstName: attendees.firstName,
      lastName: attendees.lastName,
      email: attendees.email,
      phoneNumber: attendees.phoneNumber,
      ticketTypeName: ticketTypes.name,
      orderNumber: orders.orderNumber,
      isCheckedIn: attendees.isCheckedIn,
      checkedInAt: attendees.checkedInAt,
      isRevoked: attendees.isRevoked,
      createdAt: attendees.createdAt,
    })
    .from(attendees)
    .leftJoin(ticketTypes, eq(attendees.ticketTypeId, ticketTypes.id))
    .leftJoin(orders, eq(attendees.orderId, orders.id))
    .where(eq(attendees.eventId, eventId))
    .orderBy(attendees.createdAt);

  const headers = [
    'Ticket Code',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Ticket Type',
    'Order Number',
    'Checked In',
    'Checked In At',
    'Revoked',
    'Registration Date',
  ];

  const csvRows = rows.map((r) => [
    r.ticketCode,
    r.firstName,
    r.lastName,
    r.email,
    r.phoneNumber ?? '',
    r.ticketTypeName ?? '',
    r.orderNumber ?? '',
    r.isCheckedIn ? 'Yes' : 'No',
    r.checkedInAt ? r.checkedInAt.toISOString() : '',
    r.isRevoked ? 'Yes' : 'No',
    r.createdAt.toISOString(),
  ]);

  const csv = buildCsv(headers, csvRows);
  return Buffer.from(csv, 'utf-8');
}

// ─── Orders CSV ───────────────────────────────────────────────────────────────

async function generateOrdersExport(eventId: string, organizerId: string): Promise<Buffer> {
  const [event] = await db
    .select({ organizerId: events.organizerId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || event.organizerId !== organizerId) {
    throw new Error('Event not found or access denied.');
  }

  const rows = await db
    .select({
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      status: orders.status,
      isFreeOrder: orders.isFreeOrder,
      subtotal: orders.subtotal,
      serviceFee: orders.serviceFee,
      totalAmount: orders.totalAmount,
      paidAt: orders.paidAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.eventId, eventId))
    .orderBy(orders.createdAt);

  const headers = [
    'Order Number',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Status',
    'Free Order',
    'Subtotal (₦)',
    'Service Fee (₦)',
    'Total (₦)',
    'Paid At',
    'Created At',
  ];

  const csvRows = rows.map((r) => [
    r.orderNumber,
    r.customerName,
    r.customerEmail,
    r.customerPhone ?? '',
    r.status,
    r.isFreeOrder ? 'Yes' : 'No',
    (r.subtotal / 100).toFixed(2),
    (r.serviceFee / 100).toFixed(2),
    (r.totalAmount / 100).toFixed(2),
    r.paidAt ? r.paidAt.toISOString() : '',
    r.createdAt.toISOString(),
  ]);

  const csv = buildCsv(headers, csvRows);
  return Buffer.from(csv, 'utf-8');
}

// ─── Worker ───────────────────────────────────────────────────────────────────

async function processExportJob(job: Job): Promise<void> {
  const { name } = job;
  logger.info('Processing export job', { jobName: name, jobId: job.id });

  switch (name) {
    case EXPORT_JOBS.ATTENDEES_CSV: {
      const { eventId, organizerId, requestedBy } = job.data as AttendeesExportPayload;

      const csvBuffer = await generateAttendeesExport(eventId, organizerId);

      // Upload to Cloudinary as a temporary file (24hr TTL via folder convention)
      const uploaded = await uploadBuffer(
        csvBuffer,
        'eventhub/events/banners', // Reuse existing folder — CSV stored as raw resource
        { filename: `attendees-${eventId}-${Date.now()}.csv` }
      );

      logger.info('Attendees CSV export uploaded', {
        eventId,
        organizerId,
        url: uploaded.url,
        requestedBy,
      });

      // PHASE 9: send export-ready email to organizer with download link
      // enqueueExportReadyEmail({ to: organizerEmail, downloadUrl: uploaded.url, expiresIn: '24 hours' });

      break;
    }

    case EXPORT_JOBS.ORDERS_CSV: {
      const { eventId, organizerId, requestedBy } = job.data as OrdersExportPayload;

      const csvBuffer = await generateOrdersExport(eventId, organizerId);

      const uploaded = await uploadBuffer(
        csvBuffer,
        'eventhub/events/banners',
        { filename: `orders-${eventId}-${Date.now()}.csv` }
      );

      logger.info('Orders CSV export uploaded', {
        eventId,
        organizerId,
        url: uploaded.url,
        requestedBy,
      });

      // PHASE 9: enqueue export-ready email with download URL
      break;
    }

    default:
      logger.warn('Unknown export job', { jobName: name });
  }
}

export function createExportWorker(): Worker {
  const worker = new Worker('export', processExportJob, {
    connection: getRedis(),
    concurrency: 1, // Exports are CPU-intensive — run one at a time
  });

  worker.on('completed', (job) => {
    logger.info('Export job completed', { jobId: job.id, jobName: job.name });
  });

  worker.on('failed', (job, error) => {
    logger.error('Export job failed', {
      jobId: job?.id,
      jobName: job?.name,
      error: error.message,
    });
  });

  return worker;
}