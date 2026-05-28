import {
  pgTable,
  uuid,
  integer,
  boolean,
  timestamp,
  numeric,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { transactions } from './transactions.schema';
import { orders } from './orders.schema';
import { users } from './users.schema';
import { events } from './events.schema';

export const platformLedger = pgTable(
  'platform_ledger',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    transactionId: uuid('transaction_id')
      .notNull()
      .unique()
      .references(() => transactions.id),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    organizerId: uuid('organizer_id')
      .notNull()
      .references(() => users.id),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    grossAmount: integer('gross_amount').notNull(),    // total ticket sale in kobo
    platformFee: integer('platform_fee').notNull(),   // EventHub's earning in kobo
    organizerNet: integer('organizer_net').notNull(), // what organizer received in kobo
    feePercent: numeric('fee_percent', { precision: 5, scale: 2 }).notNull(), // snapshot of rate
    isReversed: boolean('is_reversed').default(false).notNull(),
    reversedAt: timestamp('reversed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_platform_ledger_organizer').on(table.organizerId),
    index('idx_platform_ledger_event').on(table.eventId),
    index('idx_platform_ledger_created').on(table.createdAt),
  ]
);

export const platformLedgerRelations = relations(platformLedger, ({ one }) => ({
  transaction: one(transactions, {
    fields: [platformLedger.transactionId],
    references: [transactions.id],
  }),
  order: one(orders, {
    fields: [platformLedger.orderId],
    references: [orders.id],
  }),
  organizer: one(users, {
    fields: [platformLedger.organizerId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [platformLedger.eventId],
    references: [events.id],
  }),
}));

export type PlatformLedgerEntry = typeof platformLedger.$inferSelect;
export type NewPlatformLedgerEntry = typeof platformLedger.$inferInsert;