import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { orders } from './orders.schema';
import { orderItems } from './order-items.schema';
import { events } from './events.schema';
import { ticketTypes } from './ticket-types.schema';

export const attendees = pgTable(
  'attendees',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    ticketTypeId: uuid('ticket_type_id')
      .notNull()
      .references(() => ticketTypes.id),
    ticketCode: text('ticket_code').unique().notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phoneNumber: text('phone_number'),
    isCheckedIn: boolean('is_checked_in').default(false).notNull(),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
    checkedInBy: uuid('checked_in_by'), // staff/organizer user id — no FK to allow flexibility
    isRevoked: boolean('is_revoked').default(false).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: text('revoked_reason'),
    qrCodeUrl: text('qr_code_url'),      // Cloudinary URL — set async after payment
    qrCodePublicId: text('qr_code_public_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_attendees_ticket_code').on(table.ticketCode),
    index('idx_attendees_event').on(table.eventId),
    index('idx_attendees_order').on(table.orderId),
  ]
);

export const attendeesRelations = relations(attendees, ({ one }) => ({
  order: one(orders, {
    fields: [attendees.orderId],
    references: [orders.id],
  }),
  orderItem: one(orderItems, {
    fields: [attendees.orderItemId],
    references: [orderItems.id],
  }),
  event: one(events, {
    fields: [attendees.eventId],
    references: [events.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [attendees.ticketTypeId],
    references: [ticketTypes.id],
  }),
}));

export type Attendee = typeof attendees.$inferSelect;
export type NewAttendee = typeof attendees.$inferInsert;