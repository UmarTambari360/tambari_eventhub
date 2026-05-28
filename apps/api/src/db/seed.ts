/**
 * Database seed script for local development.
 * Run with: pnpm --filter api db:seed
 *
 * Creates:
 * - 1 super admin
 * - 2 approved organizers (with profiles + mock Paystack subaccount codes)
 * - 2 attendee users
 * - 3 published events (2 paid, 1 free) with ticket types
 * - Platform settings rows
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db, pool } from './index.js';
import {
  users,
  organizerProfiles,
  platformSettings,
  events,
  ticketTypes,
} from './schema/index.js';
import { generateSlug } from '../utils/code-generator.js';
import { toKobo } from '../utils/currency.js';
import { logger } from '../lib/logger.js';

const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Password123!';

async function seed(): Promise<void> {
  logger.info('🌱 Starting database seed...');

  // ─── Truncate all tables in dependency order ─────────────────────────────
  // Use CASCADE to handle FK constraints automatically
  await db.execute(
    `TRUNCATE TABLE
      platform_ledger,
      webhook_logs,
      transactions,
      attendees,
      order_items,
      orders,
      ticket_types,
      events,
      platform_settings,
      organizer_profiles,
      organizer_applications,
      refresh_tokens,
      users
    RESTART IDENTITY CASCADE`
  );
  logger.info('✅ Tables truncated');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  // ─── 1. Super Admin ───────────────────────────────────────────────────────
  const [admin] = await db
    .insert(users)
    .values({
      email: 'admin@eventhub.ng',
      passwordHash,
      fullName: 'Platform Admin',
      role: 'admin',
    })
    .returning();

  if (!admin) throw new Error('Failed to insert admin user');
  logger.info(`✅ Admin created: ${admin.email}`);

  // ─── 2. Organizer Users ───────────────────────────────────────────────────
  const [organizer1User, organizer2User] = await db
    .insert(users)
    .values([
      {
        email: 'lagos.events@example.com',
        passwordHash,
        fullName: 'Chidi Okafor',
        role: 'organizer',
        phoneNumber: '+2348012345678',
      },
      {
        email: 'abuja.concerts@example.com',
        passwordHash,
        fullName: 'Amina Bello',
        role: 'organizer',
        phoneNumber: '+2348087654321',
      },
    ])
    .returning();

  if (!organizer1User || !organizer2User)
    throw new Error('Failed to insert organizer users');
  logger.info(
    `✅ Organizers created: ${organizer1User.email}, ${organizer2User.email}`
  );

  // ─── 3. Organizer Profiles ────────────────────────────────────────────────
  const [profile1, profile2] = await db
    .insert(organizerProfiles)
    .values([
      {
        userId: organizer1User.id,
        businessName: 'Lagos Live Events',
        businessDescription:
          'Premier event management company in Lagos. We bring world-class music, arts, and cultural experiences to Nigeria.',
        websiteUrl: 'https://lagoislive.example.com',
        instagramHandle: '@lagoislive',
        paystackSubaccountCode: 'ACCT_mock_lagos001',
        paystackSubaccountId: 'mock_sub_id_001',
        bankName: 'First Bank of Nigeria',
        bankAccountNumber: '****1234', // masked
        bankAccountName: 'Lagos Live Events Ltd',
        status: 'approved',
        totalEventsCreated: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
      },
      {
        userId: organizer2User.id,
        businessName: 'Abuja Concert Series',
        businessDescription:
          'Bringing the best live music, comedy, and entertainment to the FCT.',
        websiteUrl: 'https://abujaconcerts.example.com',
        instagramHandle: '@abujaconcerts',
        paystackSubaccountCode: 'ACCT_mock_abuja001',
        paystackSubaccountId: 'mock_sub_id_002',
        bankName: 'Guaranty Trust Bank',
        bankAccountNumber: '****5678', // masked
        bankAccountName: 'Abuja Concert Series Ltd',
        status: 'approved',
        totalEventsCreated: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
      },
    ])
    .returning();

  if (!profile1 || !profile2)
    throw new Error('Failed to insert organizer profiles');
  logger.info(`✅ Organizer profiles created`);

  // ─── 4. Attendee Users ────────────────────────────────────────────────────
  const [attendee1, attendee2] = await db
    .insert(users)
    .values([
      {
        email: 'emeka.nwosu@example.com',
        passwordHash,
        fullName: 'Emeka Nwosu',
        role: 'attendee',
        phoneNumber: '+2348011112222',
      },
      {
        email: 'fatima.aliyu@example.com',
        passwordHash,
        fullName: 'Fatima Aliyu',
        role: 'attendee',
        phoneNumber: '+2348033334444',
      },
    ])
    .returning();

  if (!attendee1 || !attendee2)
    throw new Error('Failed to insert attendee users');
  logger.info(
    `✅ Attendees created: ${attendee1.email}, ${attendee2.email}`
  );

  // ─── 5. Platform Settings ─────────────────────────────────────────────────
  await db.insert(platformSettings).values([
    {
      key: 'service_fee_percent',
      value: '2.5',
      description: 'Platform service fee percentage charged on every paid ticket (e.g. 2.5 = 2.5%)',
      updatedBy: admin.id,
    },
    {
      key: 'max_featured_events',
      value: '8',
      description: 'Maximum number of events that can be featured on the homepage',
      updatedBy: admin.id,
    },
    {
      key: 'event_categories',
      value: JSON.stringify([
        'Music',
        'Business',
        'Arts',
        'Food',
        'Sports',
        'Tech',
        'Fashion',
        'Culture',
        'Comedy',
        'Religion',
      ]),
      description: 'Available event categories (JSON array of strings)',
      updatedBy: admin.id,
    },
    {
      key: 'platform_name',
      value: 'EventHub',
      description: 'Display name of the platform',
      updatedBy: admin.id,
    },
    {
      key: 'support_email',
      value: 'support@eventhub.ng',
      description: 'Support email address shown to users',
      updatedBy: admin.id,
    },
  ]);
  logger.info('✅ Platform settings seeded');

  // ─── 6. Events ────────────────────────────────────────────────────────────

  // Event 1: Paid music festival (organizer 1)
  const [event1] = await db
    .insert(events)
    .values({
      title: 'Lagos Music Festival 2025',
      description:
        'The biggest music festival in West Africa returns! Experience 3 stages, 30+ artists, and an unforgettable night under the Lagos sky. Featuring Afrobeats, Highlife, and Amapiano acts.',
      slug: generateSlug('Lagos Music Festival 2025'),
      organizerId: organizer1User.id,
      venue: 'Eko Atlantic City Amphitheatre',
      location: 'Lagos',
      address: 'Eko Atlantic, Victoria Island, Lagos',
      eventDate: new Date('2025-08-16T18:00:00+01:00'),
      eventEndDate: new Date('2025-08-17T02:00:00+01:00'),
      isPublished: true,
      isFeatured: true,
      featureOrder: 1,
      isCancelled: false,
      isFree: false,
      totalCapacity: 5000,
      category: 'Music',
      tags: ['afrobeats', 'festival', 'music', 'lagos'],
    })
    .returning();

  if (!event1) throw new Error('Failed to insert event 1');

  // Event 2: Paid tech conference (organizer 2)
  const [event2] = await db
    .insert(events)
    .values({
      title: 'Abuja Tech Summit 2025',
      description:
        'Nigeria\'s premier technology conference bringing together founders, engineers, investors, and policymakers. Two days of talks, workshops, and networking.',
      slug: generateSlug('Abuja Tech Summit 2025'),
      organizerId: organizer2User.id,
      venue: 'Transcorp Hilton Conference Centre',
      location: 'Abuja',
      address: '1 Aguiyi Ironsi Street, Maitama, Abuja',
      eventDate: new Date('2025-09-05T09:00:00+01:00'),
      eventEndDate: new Date('2025-09-06T18:00:00+01:00'),
      isPublished: true,
      isFeatured: true,
      featureOrder: 2,
      isCancelled: false,
      isFree: false,
      totalCapacity: 1200,
      category: 'Tech',
      tags: ['tech', 'startup', 'innovation', 'abuja'],
    })
    .returning();

  if (!event2) throw new Error('Failed to insert event 2');

  // Event 3: Free community meetup (organizer 1)
  const [event3] = await db
    .insert(events)
    .values({
      title: 'Lagos Creatives Meetup — August Edition',
      description:
        'Monthly free meetup for designers, photographers, videographers, and creatives in Lagos. Come network, share your work, and collaborate.',
      slug: generateSlug('Lagos Creatives Meetup August'),
      organizerId: organizer1User.id,
      venue: 'Co-creation Hub (CcHUB)',
      location: 'Lagos',
      address: '294 Herbert Macaulay Way, Yaba, Lagos',
      eventDate: new Date('2025-08-23T14:00:00+01:00'),
      eventEndDate: new Date('2025-08-23T18:00:00+01:00'),
      isPublished: true,
      isFeatured: false,
      isCancelled: false,
      isFree: true,
      totalCapacity: 150,
      category: 'Arts',
      tags: ['creative', 'design', 'networking', 'free'],
    })
    .returning();

  if (!event3) throw new Error('Failed to insert event 3');

  logger.info(
    `✅ Events created: ${event1.title}, ${event2.title}, ${event3.title}`
  );

  // ─── 7. Ticket Types ──────────────────────────────────────────────────────

  // Event 1 ticket types (paid festival)
  await db.insert(ticketTypes).values([
    {
      eventId: event1.id,
      name: 'General Admission',
      description: 'Access to all 3 stages. Standing area.',
      price: toKobo(15_000), // ₦15,000
      quantity: 3000,
      quantitySold: 0,
      minPurchase: 1,
      maxPurchase: 6,
      isActive: true,
    },
    {
      eventId: event1.id,
      name: 'VIP',
      description: 'VIP lounge access, reserved seating, 2 complimentary drinks, and backstage tour entry.',
      price: toKobo(45_000), // ₦45,000
      quantity: 500,
      quantitySold: 0,
      minPurchase: 1,
      maxPurchase: 4,
      isActive: true,
    },
    {
      eventId: event1.id,
      name: 'VVIP Table',
      description: 'Private table for 6, premium bottle service, dedicated host, and meet & greet.',
      price: toKobo(250_000), // ₦250,000 per seat
      quantity: 60,
      quantitySold: 0,
      minPurchase: 1,
      maxPurchase: 6,
      isActive: true,
    },
  ]);

  // Event 2 ticket types (paid tech summit)
  await db.insert(ticketTypes).values([
    {
      eventId: event2.id,
      name: 'Standard Pass',
      description: 'Full 2-day access to all talks and workshops.',
      price: toKobo(25_000), // ₦25,000
      quantity: 800,
      quantitySold: 0,
      minPurchase: 1,
      maxPurchase: 5,
      isActive: true,
    },
    {
      eventId: event2.id,
      name: 'Startup Founder Pass',
      description: '2-day access + investor speed dating session + startup showcase booth.',
      price: toKobo(75_000), // ₦75,000
      quantity: 100,
      quantitySold: 0,
      minPurchase: 1,
      maxPurchase: 2,
      isActive: true,
    },
    {
      eventId: event2.id,
      name: 'Student Pass',
      description: 'Full 2-day access for students with valid ID. Bring your school ID.',
      price: toKobo(5_000), // ₦5,000
      quantity: 300,
      quantitySold: 0,
      minPurchase: 1,
      maxPurchase: 3,
      isActive: true,
    },
  ]);

  // Event 3 ticket type (free meetup)
  await db.insert(ticketTypes).values([
    {
      eventId: event3.id,
      name: 'Free Entry',
      description: 'Open to all creatives. Register to reserve your spot.',
      price: 0, // free
      quantity: 150,
      quantitySold: 0,
      minPurchase: 1,
      maxPurchase: 2,
      isActive: true,
    },
  ]);

  logger.info('✅ Ticket types seeded');

  // ─── Summary ─────────────────────────────────────────────────────────────
  logger.info('');
  logger.info('🎉 Seed complete! Test accounts (all use password: Password123!):');
  logger.info(`   Admin:       admin@eventhub.ng`);
  logger.info(`   Organizer 1: lagos.events@example.com`);
  logger.info(`   Organizer 2: abuja.concerts@example.com`);
  logger.info(`   Attendee 1:  emeka.nwosu@example.com`);
  logger.info(`   Attendee 2:  fatima.aliyu@example.com`);
}

seed()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    logger.error('Seed failed', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    await pool.end();
    process.exit(1);
  });