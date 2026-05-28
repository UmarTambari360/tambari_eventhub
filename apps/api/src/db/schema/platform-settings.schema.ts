import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users.schema';

export const platformSettings = pgTable('platform_settings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  key: text('key').unique().notNull(),
  value: text('value').notNull(), // always stored as string, parsed by consumer
  description: text('description'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export const platformSettingsRelations = relations(
  platformSettings,
  ({ one }) => ({
    updater: one(users, {
      fields: [platformSettings.updatedBy],
      references: [users.id],
    }),
  })
);

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;