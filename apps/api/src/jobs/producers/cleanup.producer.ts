import { cleanupQueue, CLEANUP_JOBS } from '../queues.js';

export interface ExpirePendingOrderPayload {
  orderId: string;
  orderNumber: string;
}

export interface UnpublishSuspendedOrganizerEventsPayload {
  organizerId: string;
  reason: string;
}

/**
 * Schedule an order expiry job.
 * Fires after 30 minutes (1_800_000ms) unless the order is already paid.
 */
export async function enqueueOrderExpiry(
  payload: ExpirePendingOrderPayload
): Promise<string | undefined> {
  const job = await cleanupQueue.add(
    CLEANUP_JOBS.EXPIRE_PENDING_ORDER,
    payload,
    {
      delay: 30 * 60 * 1000, // 30 minutes
      attempts: 3,
      backoff: { type: 'fixed', delay: 5_000 },
      // Use orderId as jobId so we can cancel it on payment success
      jobId: `expire-order-${payload.orderId}`,
    }
  );
  return job.id;
}

/**
 * Cancel an existing order expiry job when the order is paid.
 * This prevents the expiry job from running after successful payment.
 */
export async function cancelOrderExpiry(orderId: string): Promise<void> {
  const jobId = `expire-order-${orderId}`;
  const job = await cleanupQueue.getJob(jobId);
  if (job) {
    await job.remove();
  }
}

export async function enqueueUnpublishSuspendedOrganizerEvents(
  payload: UnpublishSuspendedOrganizerEventsPayload
): Promise<void> {
  await cleanupQueue.add(
    CLEANUP_JOBS.UNPUBLISH_SUSPENDED_ORGANIZER_EVENTS,
    payload,
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2_000 },
    }
  );
}