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
import { sql, relations } from 'drizzle-orm';
import { orders } from './orders.schema';

export const transactionProviderEnum = pgEnum('transaction_provider', [
  'paystack',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'success',
  'failed',
  'abandoned',
]);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    reference: text('reference').unique().notNull(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    provider: transactionProviderEnum('provider').default('paystack').notNull(),
    amount: integer('amount').notNull(),       // total charged in kobo
    platformFee: integer('platform_fee').notNull(), // EventHub's cut in kobo
    organizerAmount: integer('organizer_amount').notNull(), // organizer's net in kobo
    currency: text('currency').default('NGN').notNull(),
    email: text('email').notNull(),
    status: transactionStatusEnum('status').default('pending').notNull(),
    // Paystack Split
    splitCode: text('split_code'),
    subaccountCode: text('subaccount_code'),
    // Paystack response fields
    paystackReference: text('paystack_reference'),
    accessCode: text('access_code'),
    authorizationUrl: text('authorization_url'),
    channel: text('channel'),       // card, bank, ussd, qr
    cardType: text('card_type'),
    bank: text('bank'),
    lastFourDigits: text('last_four_digits'),
    paystackResponse: jsonb('paystack_response'),
    gatewayResponse: text('gateway_response'),
    // Verification
    isVerified: boolean('is_verified').default(false).notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    webhookReceived: boolean('webhook_received').default(false).notNull(),
    webhookReceivedAt: timestamp('webhook_received_at', { withTimezone: true }),
    webhookAttempts: integer('webhook_attempts').default(0).notNull(),
    failureReason: text('failure_reason'),
    ipAddress: text('ip_address'),
    // Refund
    isRefunded: boolean('is_refunded').default(false).notNull(),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    paystackRefundId: text('paystack_refund_id'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_transactions_reference').on(table.reference),
    index('idx_transactions_order').on(table.orderId),
  ]
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;