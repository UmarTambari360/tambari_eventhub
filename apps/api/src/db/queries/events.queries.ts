import { 
    and, desc, eq, 
    gte, ilike, lte, 
    or, sql, count, asc } from 'drizzle-orm';
import { db }             from '../index.js';
import { 
    events, ticketTypes, 
    users, organizerProfiles }   from '../schema/index.js';
import type { EventFilterInput } from '@eventhub/validators';

// ─── Shared column selections ────────────────────────────────────────────────

/**
 * Columns to select for a public event list item.
 * Avoids selecting heavy fields like description.
 */
const eventListColumns = {
  id: events.id,
  title: events.title,
  slug: events.slug,
  venue: events.venue,
  location: events.location,
  eventDate: events.eventDate,
  eventEndDate: events.eventEndDate,
  thumbnailUrl: events.thumbnailUrl,
  bannerImageUrl: events.bannerImageUrl,
  isFree: events.isFree,
  isFeatured: events.isFeatured,
  isCancelled: events.isCancelled,
  featureOrder: events.featureOrder,
  category: events.category,
  tags: events.tags,
  totalCapacity: events.totalCapacity,
  isPublished: events.isPublished,
  createdAt: events.createdAt,
  updatedAt: events.updatedAt,
  organizerId: events.organizerId,
  organizerFullName: users.fullName,
  organizerBusinessName: organizerProfiles.businessName,
  organizerAvatarUrl: users.avatarUrl,
};

// ─── Public queries ───────────────────────────────────────────────────────────

export async function queryPublishedEvents(filter: EventFilterInput) {
  const { search, category, location, isFree, dateFrom, dateTo, page, limit, sortBy } = filter;
  const offset = (page - 1) * limit;

  const conditions = [
    eq(events.isPublished, true),
    eq(events.isCancelled, false),
  ];

  if (search) {
    conditions.push(
      or(
        ilike(events.title, `%${search}%`),
        ilike(events.venue, `%${search}%`),
        ilike(events.location, `%${search}%`)
      )!
    );
  }
  if (category) conditions.push(eq(events.category, category));
  if (location) conditions.push(ilike(events.location, `%${location}%`));
  if (isFree !== undefined) conditions.push(eq(events.isFree, isFree));
  if (dateFrom) conditions.push(gte(events.eventDate, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(events.eventDate, new Date(dateTo)));

  const where = and(...conditions);

  const orderBy =
    sortBy === 'created'
      ? desc(events.createdAt)
      : sortBy === 'popular'
        ? desc(sql`(select coalesce(sum(quantity_sold), 0) from ticket_types where event_id = ${events.id})`)
        : asc(events.eventDate);

  const [rows, countRows] = await Promise.all([
    db
      .select(eventListColumns)
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(organizerProfiles, eq(events.organizerId, organizerProfiles.userId))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),

    db
      .select({ count: count() })
      .from(events)
      .where(where),
  ]);

  const total = countRows[0]?.count ?? 0;

  return { rows, total };
}

export async function queryEventBySlug(slug: string) {
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      slug: events.slug,
      venue: events.venue,
      location: events.location,
      address: events.address,
      eventDate: events.eventDate,
      eventEndDate: events.eventEndDate,
      bannerImageUrl: events.bannerImageUrl,
      bannerPublicId: events.bannerPublicId,
      thumbnailUrl: events.thumbnailUrl,
      thumbnailPublicId: events.thumbnailPublicId,
      isPublished: events.isPublished,
      isFeatured: events.isFeatured,
      featureOrder: events.featureOrder,
      isCancelled: events.isCancelled,
      isFree: events.isFree,
      totalCapacity: events.totalCapacity,
      category: events.category,
      tags: events.tags,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
      organizerId: events.organizerId,
      organizerFullName: users.fullName,
      organizerAvatarUrl: users.avatarUrl,
      organizerBusinessName: organizerProfiles.businessName,
    })
    .from(events)
    .leftJoin(users, eq(events.organizerId, users.id))
    .leftJoin(organizerProfiles, eq(events.organizerId, organizerProfiles.userId))
    .where(eq(events.slug, slug))
    .limit(1);

  return event ?? null;
}

export async function queryEventById(eventId: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  return event ?? null;
}

export async function queryTicketTypesForEvent(eventId: string) {
  return db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.eventId, eventId))
    .orderBy(asc(ticketTypes.createdAt));
}

export async function queryFeaturedEvents() {
  const rows = await db
    .select(eventListColumns)
    .from(events)
    .leftJoin(users, eq(events.organizerId, users.id))
    .leftJoin(organizerProfiles, eq(events.organizerId, organizerProfiles.userId))
    .where(
      and(
        eq(events.isPublished, true),
        eq(events.isFeatured, true),
        eq(events.isCancelled, false)
      )
    )
    .orderBy(asc(events.featureOrder));

  return rows;
}

// ─── Organizer queries ────────────────────────────────────────────────────────

export async function queryOrganizerEvents(
  organizerId: string,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        ...eventListColumns,
        description: events.description,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(organizerProfiles, eq(events.organizerId, organizerProfiles.userId))
      .where(eq(events.organizerId, organizerId))
      .orderBy(desc(events.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: count() })
      .from(events)
      .where(eq(events.organizerId, organizerId)),
  ]);

  return { rows, total: countRows[0]?.count ?? 0 };
}