import { webhookQueue, WEBHOOK_JOBS } from '../queues.js';

export interface WebhookProcessingPayload {
  event: string;
  payload: Record<string, unknown>;
  reference: string | null;
  webhookLogId: string | undefined;
}

export async function enqueueWebhookProcessing(
  payload: WebhookProcessingPayload
): Promise<void> {
  await webhookQueue.add(WEBHOOK_JOBS.PROCESS_PAYSTACK, payload, {
    // Delay slightly to allow DB writes to propagate
    delay: 500,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 3_000,
    },
  });
}