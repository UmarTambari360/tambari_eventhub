import { Worker, type Job } from 'bullmq';
import { db } from '../../db/index.js';
import { events, orderItems, orders, webhookLogs } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { processWebhookPaymentSuccess } from '../../services/payment.service.js';
import { enqueueQrCodeGeneration } from '../producers/qrcode.producer.js';
import { cancelOrderExpiry } from '../producers/cleanup.producer.js';
import type { WebhookProcessingPayload } from '../producers/webhook.producer.js';
import { queryTransactionByReference } from '../../db/queries/orders.queries.js';
import { enqueueOrderConfirmationEmail } from '../producers/email.producer.js';

async function processWebhookJob(job: Job): Promise<void> {
  const { event, payload, reference, webhookLogId } =
    job.data as WebhookProcessingPayload;

  logger.info('Processing webhook', { event, reference, jobId: job.id });

  // Mark log as processing
  if (webhookLogId) {
    await db
      .update(webhookLogs)
      .set({ status: 'processing', retryCount: job.attemptsMade })
      .where(eq(webhookLogs.id, webhookLogId));
  }

  try {
    switch (event) {
      case 'charge.success': {
        if (!reference) {
          logger.warn('charge.success webhook missing reference');
          break;
        }

        const data = (payload['data'] as Record<string, unknown>) ?? {};
        await processWebhookPaymentSuccess(reference, data);

        // Get orderId from transaction to enqueue QR codes
        const txn = await queryTransactionByReference(reference);
        if (txn && txn.orderId) {
          // Cancel the expiry job
          await cancelOrderExpiry(txn.orderId);

          // Enqueue QR code generation
          await enqueueQrCodeGeneration({
            orderId: txn.orderId,
            orderNumber: reference, // Will be resolved in worker
          });
        }
         // Enqueue order confirmation email
      if (txn) {
        const orderDetails = await db
          .select({
            customerEmail: orders.customerEmail,
            customerName: orders.customerName,
            orderNumber: orders.orderNumber,
            subtotal: orders.subtotal,
            serviceFee: orders.serviceFee,
            totalAmount: orders.totalAmount,
            isFreeOrder: orders.isFreeOrder,
            eventId: orders.eventId,
          })
          .from(orders)
          .where(eq(orders.id, txn.orderId))
          .limit(1)
          .then((r) => r[0]);

        if (orderDetails) {
          const eventInfo = await db
            .select({ title: events.title, eventDate: events.eventDate, venue: events.venue, location: events.location })
            .from(events)
            .where(eq(events.id, orderDetails.eventId))
            .limit(1)
            .then((r) => r[0]);

          const orderItemRows = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, txn.orderId));

          if (eventInfo) {
            await enqueueOrderConfirmationEmail({
              to: orderDetails.customerEmail,
              customerName: orderDetails.customerName,
              orderNumber: orderDetails.orderNumber,
              eventTitle: eventInfo.title,
              eventDate: new Intl.DateTimeFormat('en-NG', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos',
              }).format(eventInfo.eventDate),
              eventVenue: eventInfo.venue,
              eventLocation: eventInfo.location,
              items: orderItemRows.map((i) => ({
                ticketTypeName: i.ticketTypeName,
                quantity: i.quantity,
                pricePerTicket: i.pricePerTicket,
                subtotal: i.subtotal,
              })),
              subtotalKobo: orderDetails.subtotal,
              serviceFeeKobo: orderDetails.serviceFee,
              totalAmountKobo: orderDetails.totalAmount,
              isFreeOrder: orderDetails.isFreeOrder,
            });
          }
        }
      }

        break;
      }

      case 'charge.failed':
      case 'transfer.failed': {
        logger.info('Payment failed webhook received', { event, reference });
        // PHASE 8: enqueue send-payment-failed email
        break;
      }

      case 'refund.processed': {
        logger.info('Refund processed webhook', { reference });
        // Refunds are handled via admin action — webhook is informational
        break;
      }

      default: {
        logger.info('Unhandled webhook event, ignoring', { event });
        if (webhookLogId) {
          await db
            .update(webhookLogs)
            .set({ status: 'ignored', processedAt: new Date() })
            .where(eq(webhookLogs.id, webhookLogId));
        }
        return;
      }
    }

    // Mark as processed
    if (webhookLogId) {
      await db
        .update(webhookLogs)
        .set({
          status: 'processed',
          isProcessed: true,
          processedAt: new Date(),
        })
        .where(eq(webhookLogs.id, webhookLogId));
    }

    logger.info('Webhook processed', { event, reference });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Webhook processing failed', {
      event,
      reference,
      error: errorMessage,
      attempt: job.attemptsMade,
    });

    if (webhookLogId) {
      await db
        .update(webhookLogs)
        .set({
          status: 'failed',
          errorMessage,
          retryCount: job.attemptsMade,
        })
        .where(eq(webhookLogs.id, webhookLogId));
    }

    throw err; // BullMQ will retry
  }
}

export function createWebhookWorker(): Worker {
  const worker = new Worker('webhook', processWebhookJob, {
    connection: getRedis(),
    concurrency: 3,
  });

  worker.on('completed', (job) => {
    logger.info('Webhook job completed', { jobId: job.id, jobName: job.name });
  });

  worker.on('failed', (job, error) => {
    logger.error('Webhook job failed', {
      jobId: job?.id,
      error: error.message,
      attempts: job?.attemptsMade,
    });
  });

  return worker;
}