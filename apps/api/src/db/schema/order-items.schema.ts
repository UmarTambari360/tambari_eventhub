import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { orders } from './orders.schema';
import { ticketTypes } from './ticket-types.schema';

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    ticketTypeId: uuid('ticket_type_id')
      .notNull()
      .references(() => ticketTypes.id),
    ticketTypeName: text('ticket_type_name').notNull(), // snapshot at purchase
    pricePerTicket: integer('price_per_ticket').notNull(), // snapshot in kobo
    quantity: integer('quantity').notNull(),
    subtotal: integer('subtotal').notNull(), // kobo
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_order_items_order').on(table.orderId),
    index('idx_order_items_ticket_type').on(table.ticketTypeId),
  ]
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [orderItems.ticketTypeId],
    references: [ticketTypes.id],
  }),
}));

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;