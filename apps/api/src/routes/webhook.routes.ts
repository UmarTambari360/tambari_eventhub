import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { webhookLogs } from '../db/schema/index.js';
import { enqueueWebhookProcessing } from '../jobs/producers/webhook.producer.js';
import { logger } from '../lib/logger.js';

const router: ExpressRouter = Router();

function getWebhookSecret(): string {
  const secret = process.env['PAYSTACK_WEBHOOK_SECRET'];
  if (!secret) throw new Error('PAYSTACK_WEBHOOK_SECRET is not set');
  return secret;
}

/**
 * POST /webhooks/paystack
 *
 * Receives Paystack webhook events.
 * Security: validates HMAC-SHA512 signature before any processing.
 * Architecture: responds 200 immediately, processes async via BullMQ.
 *
 * NOTE: This route requires raw body. In index.ts, mount it BEFORE
 * express.json() with express.raw({ type: 'application/json' }).
 */
router.post('/paystack', async (req: Request, res: Response) => {
  // Always respond 200 first — Paystack will retry if we don't
  // We validate signature and queue the job before responding
  const rawBody = req.body as Buffer;
  const signature = req.headers['x-paystack-signature'] as string | undefined;

  // Validate signature
  let isSignatureValid = false;
  try {
    const hash = crypto
      .createHmac('sha512', getWebhookSecret())
      .update(rawBody)
      .digest('hex');
    isSignatureValid = hash === signature;
  } catch {
    isSignatureValid = false;
  }

  if (!isSignatureValid) {
    logger.warn('Paystack webhook: invalid signature', {
      hasSignature: !!signature,
    });
    // Still return 200 to prevent Paystack from retrying invalid requests
    res.status(200).json({ received: true });
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody.toString()) as Record<string, unknown>;
  } catch {
    logger.warn('Paystack webhook: invalid JSON body');
    res.status(200).json({ received: true });
    return;
  }

  const event = (payload['event'] as string) ?? 'unknown';
  const data = (payload['data'] as Record<string, unknown>) ?? {};
  const reference = (data['reference'] as string) ?? null;

  // Log the webhook
  let webhookLogId: string | undefined;
  try {
    const [log] = await db
      .insert(webhookLogs)
      .values({
        event,
        payload,
        headers: {
          'x-paystack-signature': signature,
          'content-type': req.headers['content-type'],
        },
        reference,
        signature,
        isSignatureValid,
        status: 'received',
      })
      .returning({ id: webhookLogs.id });
    webhookLogId = log?.id;
  } catch (err) {
    logger.error('Failed to log webhook', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Enqueue for processing
  try {
    await enqueueWebhookProcessing({
      event,
      payload,
      reference,
      webhookLogId,
    });
    logger.info('Paystack webhook enqueued', { event, reference, webhookLogId });
  } catch (err) {
    logger.error('Failed to enqueue webhook', {
      error: err instanceof Error ? err.message : String(err),
      event,
      reference,
    });
  }

  res.status(200).json({ received: true });
});

export { router as webhookRouter };