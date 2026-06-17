import { exportQueue, EXPORT_JOBS } from '../queues.js';

export interface AttendeesExportPayload {
  eventId: string;
  organizerId: string;
  requestedBy: string; // userId who triggered the export
}

export interface OrdersExportPayload {
  eventId: string;
  organizerId: string;
  requestedBy: string;
}

export async function enqueueAttendeesExport(
  payload: AttendeesExportPayload
): Promise<string | undefined> {
  const job = await exportQueue.add(EXPORT_JOBS.ATTENDEES_CSV, payload, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10_000 },
  });
  return job.id;
}

export async function enqueueOrdersExport(
  payload: OrdersExportPayload
): Promise<string | undefined> {
  const job = await exportQueue.add(EXPORT_JOBS.ORDERS_CSV, payload, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10_000 },
  });
  return job.id;
}