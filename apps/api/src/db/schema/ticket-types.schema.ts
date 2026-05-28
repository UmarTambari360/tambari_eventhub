import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { events } from './events.schema';

export const ticketTypes = pgTable(
  'ticket_types',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    price: integer('price').notNull(), // kobo; 0 = free
    quantity: integer('quantity').notNull(),
    quantitySold: integer('quantity_sold').default(0).notNull(),
    saleStartDate: timestamp('sale_start_date', { withTimezone: true }),
    saleEndDate: timestamp('sale_end_date', { withTimezone: true }),
    minPurchase: integer('min_purchase').default(1).notNull(),
    maxPurchase: integer('max_purchase').default(10).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [index('idx_ticket_types_event').on(table.eventId)]
);

export const ticketTypesRelations = relations(ticketTypes, ({ one }) => ({
  event: one(events, {
    fields: [ticketTypes.eventId],
    references: [events.id],
  }),
}));

export type TicketType = typeof ticketTypes.$inferSelect;
export type NewTicketType = typeof ticketTypes.$inferInsert;