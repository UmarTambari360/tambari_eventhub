import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users.schema';
import { events } from './events.schema';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'paid',
  'failed',
  'cancelled',
  'refunded',
]);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orderNumber: text('order_number').unique().notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerPhone: text('customer_phone'),
    subtotal: integer('subtotal').notNull(), // kobo
    serviceFee: integer('service_fee').default(0).notNull(), // kobo; 0 for free orders
    totalAmount: integer('total_amount').notNull(), // kobo
    isFreeOrder: boolean('is_free_order').default(false).notNull(),
    status: orderStatusEnum('status').default('pending').notNull(),
    notes: text('notes'),
    expiresAt: timestamp('expires_at', { withTimezone: true }), // 30min after creation for paid events
    paidAt: timestamp('paid_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_orders_user').on(table.userId),
    index('idx_orders_event').on(table.eventId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_number').on(table.orderNumber),
  ]
);

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [orders.eventId],
    references: [events.id],
  }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;