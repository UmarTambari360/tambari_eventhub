import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users.schema';

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    title: text('title').notNull(),
    description: text('description').notNull(),
    slug: text('slug').unique().notNull(),
    organizerId: uuid('organizer_id')
      .notNull()
      .references(() => users.id),
    venue: text('venue').notNull(),
    location: text('location').notNull(),
    address: text('address'),
    eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
    eventEndDate: timestamp('event_end_date', { withTimezone: true }),
    bannerImageUrl: text('banner_image_url'),
    bannerPublicId: text('banner_public_id'),
    thumbnailUrl: text('thumbnail_url'),
    thumbnailPublicId: text('thumbnail_public_id'),
    isPublished: boolean('is_published').default(false).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    featureOrder: integer('feature_order'),
    isCancelled: boolean('is_cancelled').default(false).notNull(),
    isFree: boolean('is_free').default(false).notNull(),
    totalCapacity: integer('total_capacity'),
    category: text('category'),
    // tags stored as a Postgres text array
    tags: text('tags').array().default(sql`'{}'::text[]`).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_events_organizer').on(table.organizerId),
    index('idx_events_slug').on(table.slug),
    index('idx_events_date').on(table.eventDate),
    index('idx_events_published')
      .on(table.isPublished)
      .where(sql`is_published = true`),
    index('idx_events_featured')
      .on(table.isFeatured, table.featureOrder)
      .where(sql`is_featured = true`),
    index('idx_events_category').on(table.category),
  ]
);

export const eventsRelations = relations(events, ({ one }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;