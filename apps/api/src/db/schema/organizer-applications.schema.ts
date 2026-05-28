import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users.schema';

export const applicationStatusEnum = pgEnum('application_status', [
  'pending',
  'approved',
  'rejected',
]);

export const organizerApplications = pgTable(
  'organizer_applications',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    businessName: text('business_name').notNull(),
    businessDescription: text('business_description').notNull(),
    websiteUrl: text('website_url'),
    instagramHandle: text('instagram_handle'),
    // Bank details collected at application time
    bankName: text('bank_name').notNull(),
    bankCode: text('bank_code').notNull(),
    bankAccountNumber: text('bank_account_number').notNull(), // stored encrypted
    bankAccountName: text('bank_account_name').notNull(),
    // Review
    status: applicationStatusEnum('status').default('pending').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_organizer_applications_status').on(table.status),
    index('idx_organizer_applications_user').on(table.userId),
  ]
);

export const organizerApplicationsRelations = relations(
  organizerApplications,
  ({ one }) => ({
    user: one(users, {
      fields: [organizerApplications.userId],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [organizerApplications.reviewedBy],
      references: [users.id],
    }),
  })
);

export type OrganizerApplication = typeof organizerApplications.$inferSelect;
export type NewOrganizerApplication = typeof organizerApplications.$inferInsert;