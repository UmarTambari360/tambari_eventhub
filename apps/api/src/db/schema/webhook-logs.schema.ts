import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const webhookStatusEnum = pgEnum('webhook_status', [
  'received',
  'processing',
  'processed',
  'failed',
  'ignored',
]);

export const webhookLogs = pgTable(
  'webhook_logs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    event: text('event').notNull(),
    payload: jsonb('payload').notNull(),
    headers: jsonb('headers'),
    reference: text('reference'),
    signature: text('signature'),
    isSignatureValid: boolean('is_signature_valid').default(false).notNull(),
    status: webhookStatusEnum('status').default('received').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').default(0).notNull(),
    isProcessed: boolean('is_processed').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_webhook_logs_reference').on(table.reference),
    index('idx_webhook_logs_is_processed').on(table.isProcessed),
  ]
);

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert;