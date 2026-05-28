import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users } from './users.schema';

export const organizerStatusEnum = pgEnum('organizer_status', [
  'pending',
  'approved',
  'rejected',
  'suspended',
]);

export const organizerProfiles = pgTable(
  'organizer_profiles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    businessName: text('business_name').notNull(),
    businessDescription: text('business_description'),
    websiteUrl: text('website_url'),
    instagramHandle: text('instagram_handle'),
    // Paystack subaccount — populated on admin approval
    paystackSubaccountCode: text('paystack_subaccount_code').unique(),
    paystackSubaccountId: text('paystack_subaccount_id'),
    bankName: text('bank_name'),
    bankAccountNumber: text('bank_account_number'), // stored masked: ****1234
    bankAccountName: text('bank_account_name'),
    // Status
    status: organizerStatusEnum('status').default('pending').notNull(),
    // Denormalized counters
    totalEventsCreated: integer('total_events_created').default(0).notNull(),
    totalTicketsSold: integer('total_tickets_sold').default(0).notNull(),
    totalRevenue: integer('total_revenue').default(0).notNull(), // gross in kobo
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_organizer_profiles_user').on(table.userId),
    index('idx_organizer_profiles_subaccount').on(table.paystackSubaccountCode),
  ]
);

export const organizerProfilesRelations = relations(
  organizerProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [organizerProfiles.userId],
      references: [users.id],
    }),
  })
);

export type OrganizerProfile = typeof organizerProfiles.$inferSelect;
export type NewOrganizerProfile = typeof organizerProfiles.$inferInsert;