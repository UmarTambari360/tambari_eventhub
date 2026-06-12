import { Queue }    from 'bullmq';
import { getRedis } from '../lib/redis';
import { logger }   from '../lib/logger';

// Connection config — reuses the existing Redis client
function getConnection() {
  return getRedis();
}

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2_000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

// ─── Queue instances ────────────────────────────────────────────────────────

export const emailQueue = new Queue('email', {
  connection: getConnection(),
  defaultJobOptions,
});

export const qrcodeQueue = new Queue('qrcode', {
  connection: getConnection(),
  defaultJobOptions,
});

export const webhookQueue = new Queue('webhook', {
  connection: getConnection(),
  defaultJobOptions,
});

export const exportQueue = new Queue('export', {
  connection: getConnection(),
  defaultJobOptions,
});

export const cleanupQueue = new Queue('cleanup', {
  connection: getConnection(),
  defaultJobOptions,
});

// ─── Job name constants ─────────────────────────────────────────────────────

export const EMAIL_JOBS = {
  WELCOME: 'send-welcome',
  ORGANIZER_APPLICATION_RECEIVED: 'send-organizer-application-received',
  ORGANIZER_APPROVED: 'send-organizer-approved',
  ORGANIZER_REJECTED: 'send-organizer-rejected',
  ORGANIZER_SUSPENDED: 'send-organizer-suspended',
  ORDER_CONFIRMATION: 'send-order-confirmation',
  TICKET_DELIVERY: 'send-ticket-delivery',
  PAYMENT_FAILED: 'send-payment-failed',
  EVENT_REMINDER: 'send-event-reminder',
  REFUND_CONFIRMATION: 'send-refund-confirmation',
} as const;

export const QRCODE_JOBS = {
  GENERATE: 'generate-qr-codes',
} as const;

export const WEBHOOK_JOBS = {
  PROCESS_PAYSTACK: 'process-paystack-webhook',
} as const;

export const EXPORT_JOBS = {
  ATTENDEES_CSV: 'export-attendees-csv',
  ORDERS_CSV: 'export-orders-csv',
} as const;

export const CLEANUP_JOBS = {
  EXPIRE_PENDING_ORDER: 'expire-pending-order',
  UNPUBLISH_SUSPENDED_ORGANIZER_EVENTS: 'unpublish-suspended-organizer-events',
} as const;

export type EmailJobName = (typeof EMAIL_JOBS)[keyof typeof EMAIL_JOBS];
export type QrcodeJobName = (typeof QRCODE_JOBS)[keyof typeof QRCODE_JOBS];
export type WebhookJobName = (typeof WEBHOOK_JOBS)[keyof typeof WEBHOOK_JOBS];
export type ExportJobName = (typeof EXPORT_JOBS)[keyof typeof EXPORT_JOBS];
export type CleanupJobName = (typeof CLEANUP_JOBS)[keyof typeof CLEANUP_JOBS];

logger.info('BullMQ queues initialized');