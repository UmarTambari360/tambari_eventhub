import { qrcodeQueue, QRCODE_JOBS } from '../queues.js';

export interface GenerateQrCodesPayload {
  orderId: string;
  orderNumber: string;
}

export async function enqueueQrCodeGeneration(
  payload: GenerateQrCodesPayload
): Promise<void> {
  await qrcodeQueue.add(QRCODE_JOBS.GENERATE, payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2_000 },
  });
}