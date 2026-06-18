import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { events, ticketTypes, organizerProfiles } from '../db/schema/index.js';
import { generateSlug } from '../utils/code-generator.js';
import { cacheGet, cacheSet, cacheDel } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../middleware/error.middleware.js';
import {
  queryEventBySlug,
  queryEventById,
  queryTicketTypesForEvent,
  queryPublishedEvents,
  queryFeaturedEvents,
  queryOrganizerEvents,
} from '../db/queries/events.queries.js';
import type {
  CreateEventInput,
  UpdateEventInput,
  EventFilterInput,
} from '@eventhub/validators';

const FEATURED_CACHE_KEY = 'events:featured';
const FEATURED_CACHE_TTL = 600; // 10 minutes
const EVENT_CACHE_TTL = 300; // 5 minutes

// INTERNAL HELPERS

// Verifies that the organizer has an approved profile.
// Used before create/update/publish operations.
async function ensureOrganizerApproved(organizerId: string): Promise<void> {
  const [profile] = await db
    .select({ status: organizerProfiles.status })
    .from(organizerProfiles)
    .where(eq(organizerProfiles.userId, organizerId))
    .limit(1);

  if (!profile || profile.status !== 'approved') {
    throw new ForbiddenError(
      'Your organizer account must be approved to manage events.'
    );
  }
}

// Invalidates both event-specific and featured cache.
async function invalidateEventCache(slug: string): Promise<void> {
  await cacheDel(`event:${slug}`, FEATURED_CACHE_KEY);
}

// Derives `isFree` from ticket types (true only if ALL are free).
function computeIsFree(ticketTypeRows: Array<{ price: number }>): boolean {
  if (ticketTypeRows.length === 0) return false;
  return ticketTypeRows.every((t) => t.price === 0);
}

// Builds a standardized public event response shape.
function mapToPublicEvent(row: any) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    organizer: {
      id: row.organizerId,
      fullName: row.organizerFullName ?? '',
      businessName: row.organizerBusinessName ?? null,
    },
    venue: row.venue,
    location: row.location,
    eventDate: row.eventDate.toISOString(),
    eventEndDate: row.eventEndDate?.toISOString() ?? null,
    thumbnailUrl: row.thumbnailUrl,
    bannerImageUrl: row.bannerImageUrl,
    isFree: row.isFree,
    isFeatured: row.isFeatured,
    isCancelled: row.isCancelled,
    category: row.category as string | null,
    tags: row.tags,
    totalCapacity: row.totalCapacity,
    lowestPrice: null as number | null, // can be enhanced later
    totalSold: 0,
  };
}

// Builds detailed event response with ticket types (for getBySlug and organizer view).
async function buildEventDetail(event: any) {
  const tTypes = await queryTicketTypesForEvent(event.id);
  const now = new Date();

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    slug: event.slug,
    organizer: {
      id: event.organizerId,
      fullName: event.organizerFullName ?? '',
      businessName: event.organizerBusinessName ?? null,
      avatarUrl: event.organizerAvatarUrl ?? null,
    },
    venue: event.venue,
    location: event.location,
    address: event.address,
    eventDate: event.eventDate.toISOString(),
    eventEndDate: event.eventEndDate?.toISOString() ?? null,
    bannerImageUrl: event.bannerImageUrl,
    thumbnailUrl: event.thumbnailUrl,
    isPublished: event.isPublished,
    isFeatured: event.isFeatured,
    featureOrder: event.featureOrder,
    isCancelled: event.isCancelled,
    isFree: event.isFree,
    totalCapacity: event.totalCapacity,
    category: event.category,
    tags: event.tags,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    ticketTypes: tTypes.map((t) => {
      const available = t.quantity - t.quantitySold;
      const saleOpen =
        t.isActive &&
        available > 0 &&
        (!t.saleStartDate || t.saleStartDate <= now) &&
        (!t.saleEndDate || t.saleEndDate >= now);

      return {
        id: t.id,
        eventId: t.eventId,
        name: t.name,
        description: t.description,
        price: t.price,
        quantity: t.quantity,
        quantitySold: t.quantitySold,
        available,
        saleStartDate: t.saleStartDate?.toISOString() ?? null,
        saleEndDate: t.saleEndDate?.toISOString() ?? null,
        minPurchase: t.minPurchase,
        maxPurchase: Math.min(t.maxPurchase, available),
        isActive: t.isActive,
        isSaleOpen: saleOpen,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    }),
  };
}

// Seeds Redis availability counters (placeholder for Phase 7).
async function seedTicketAvailability(eventId: string): Promise<void> {
  const types = await queryTicketTypesForEvent(eventId);
  // PHASE 7: Implement real Redis seeding here
  logger.debug('Ticket availability seeding deferred to Phase 7', {
    eventId,
    ticketCount: types.length,
  });
}

// PUBLIC SERVICE FUNCTIONS

// ─── Public / Shared 

export async function getPublishedEvents(filter: EventFilterInput) {
  const { rows, total } = await queryPublishedEvents(filter);
  const { page, limit } = filter;
  const totalPages = Math.ceil(total / limit);

  const items = rows.map(mapToPublicEvent);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function getFeaturedEvents() {
  const cached = await cacheGet(FEATURED_CACHE_KEY);
  if (cached) return JSON.parse(cached) as unknown[];

  const rows = await queryFeaturedEvents();
  const result = rows.map(mapToPublicEvent);

  await cacheSet(FEATURED_CACHE_KEY, JSON.stringify(result), FEATURED_CACHE_TTL);
  return result;
}

export async function getEventBySlug(slug: string) {
  const cacheKey = `event:${slug}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached) as unknown;

  const event = await queryEventBySlug(slug);
  if (!event) return null;

  const result = await buildEventDetail(event);

  // Only cache published, non-cancelled events
  if (event.isPublished && !event.isCancelled) {
    await cacheSet(cacheKey, JSON.stringify(result), EVENT_CACHE_TTL);
  }

  return result;
}

// Organizer operations

export async function createEvent(
  organizerId: string,
  input: CreateEventInput
): Promise<{ id: string; slug: string }> {
  await ensureOrganizerApproved(organizerId);

  const slug = generateSlug(input.title);

  const eventDate = new Date(input.eventDate);
  const eventEndDate = input.eventEndDate ? new Date(input.eventEndDate) : undefined;

  if (eventEndDate && eventEndDate <= eventDate) {
    throw new AppError(422, 'Event end date must be after event start date.');
  }

  const isFree = computeIsFree(input.ticketTypes);

  const [event] = await db
    .insert(events)
    .values({
      title: input.title,
      description: input.description,
      slug,
      organizerId,
      venue: input.venue,
      location: input.location,
      address: input.address || null,
      eventDate,
      eventEndDate: eventEndDate ?? null,
      bannerImageUrl: input.bannerImageUrl || null,
      bannerPublicId: input.bannerPublicId || null,
      thumbnailUrl: input.thumbnailUrl || null,
      thumbnailPublicId: input.thumbnailPublicId || null,
      category: input.category ?? null,
      tags: input.tags,
      isFree,
      isPublished: false,
      isFeatured: false,
      isCancelled: false,
    })
    .returning({ id: events.id, slug: events.slug });

  if (!event) throw new AppError(500, 'Failed to create event.');

  // Insert ticket types
  await db.insert(ticketTypes).values(
    input.ticketTypes.map((t) => ({
      eventId: event.id,
      name: t.name,
      description: t.description || null,
      price: t.price,
      quantity: t.quantity,
      quantitySold: 0,
      saleStartDate: t.saleStartDate ? new Date(t.saleStartDate) : null,
      saleEndDate: t.saleEndDate ? new Date(t.saleEndDate) : null,
      minPurchase: t.minPurchase,
      maxPurchase: t.maxPurchase,
      isActive: true,
    }))
  );

  // Update organizer counter
  await db
    .update(organizerProfiles)
    .set({ totalEventsCreated: sql`${organizerProfiles.totalEventsCreated} + 1` })
    .where(eq(organizerProfiles.userId, organizerId));

  logger.info('Event created', { eventId: event.id, organizerId, slug: event.slug });

  return { id: event.id, slug: event.slug };
}

export async function updateEvent(
  eventId: string,
  organizerId: string,
  input: UpdateEventInput
): Promise<void> {
  const event = await queryEventById(eventId);

  if (!event) throw new NotFoundError('Event not found.');
  if (event.organizerId !== organizerId) {
    throw new ForbiddenError('You do not have permission to edit this event.');
  }
  if (event.isCancelled) {
    throw new ConflictError('Cannot edit a cancelled event.');
  }

  const updateData: Partial<typeof events.$inferInsert> = { updatedAt: new Date() };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.venue !== undefined) updateData.venue = input.venue;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.address !== undefined) updateData.address = input.address || null;
  if (input.eventDate !== undefined) updateData.eventDate = new Date(input.eventDate);
  if (input.eventEndDate !== undefined)
    updateData.eventEndDate = input.eventEndDate ? new Date(input.eventEndDate) : null;
  if (input.category !== undefined) updateData.category = input.category ?? null;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.bannerImageUrl !== undefined) updateData.bannerImageUrl = input.bannerImageUrl || null;
  if (input.bannerPublicId !== undefined) updateData.bannerPublicId = input.bannerPublicId || null;
  if (input.thumbnailUrl !== undefined) updateData.thumbnailUrl = input.thumbnailUrl || null;
  if (input.thumbnailPublicId !== undefined)
    updateData.thumbnailPublicId = input.thumbnailPublicId || null;

  // Recompute isFree
  const currentTypes = await queryTicketTypesForEvent(eventId);
  updateData.isFree = computeIsFree(currentTypes);

  await db.update(events).set(updateData).where(eq(events.id, eventId));

  await invalidateEventCache(event.slug);

  logger.info('Event updated', { eventId, organizerId });
}

export async function publishEvent(
  eventId: string,
  organizerId: string,
  publish: boolean
): Promise<void> {
  const event = await queryEventById(eventId);

  if (!event) throw new NotFoundError('Event not found.');
  if (event.organizerId !== organizerId) {
    throw new ForbiddenError('You do not have permission to publish this event.');
  }
  if (event.isCancelled) {
    throw new ConflictError('Cannot publish a cancelled event.');
  }

  if (publish) {
    const tTypes = await queryTicketTypesForEvent(eventId);
    const activeTypes = tTypes.filter((t) => t.isActive);

    if (activeTypes.length === 0) {
      throw new AppError(422, 'Event must have at least one active ticket type before publishing.');
    }
    if (!event.venue || !event.location) {
      throw new AppError(422, 'Event must have venue and location set before publishing.');
    }
    if (event.eventDate <= new Date()) {
      throw new AppError(422, 'Event date must be in the future to publish.');
    }
  }

  await db
    .update(events)
    .set({ isPublished: publish, updatedAt: new Date() })
    .where(eq(events.id, eventId));

  if (publish) {
    await seedTicketAvailability(eventId);
  }

  await invalidateEventCache(event.slug);

  logger.info(publish ? 'Event published' : 'Event unpublished', { eventId, organizerId });
}

export async function cancelEvent(eventId: string, organizerId: string): Promise<void> {
  const event = await queryEventById(eventId);

  if (!event) throw new NotFoundError('Event not found.');
  if (event.organizerId !== organizerId) {
    throw new ForbiddenError('You do not have permission to cancel this event.');
  }
  if (event.isCancelled) {
    throw new ConflictError('Event is already cancelled.');
  }

  // PHASE 7: Add paid order refund checks here

  await db
    .update(events)
    .set({ isCancelled: true, isPublished: false, updatedAt: new Date() })
    .where(eq(events.id, eventId));

  await invalidateEventCache(event.slug);

  logger.info('Event cancelled', { eventId, organizerId });
}

export async function getOrganizerEventById(
  eventId: string,
  organizerId: string
) {
  const event = await queryEventById(eventId);
  if (!event) throw new NotFoundError('Event not found.');
  if (event.organizerId !== organizerId) {
    throw new ForbiddenError('Access denied.');
  }

  return await buildEventDetail(event);
}

export async function getOrganizerEventsList(
  organizerId: string,
  page: number,
  limit: number
) {
  const { rows, total } = await queryOrganizerEvents(organizerId, page, limit);
  const totalPages = Math.ceil(total / limit);

  const items = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    venue: row.venue,
    location: row.location,
    eventDate: row.eventDate.toISOString(),
    eventEndDate: row.eventEndDate?.toISOString() ?? null,
    thumbnailUrl: row.thumbnailUrl,
    bannerImageUrl: row.bannerImageUrl,
    isFree: row.isFree,
    isPublished: row.isPublished,
    isFeatured: row.isFeatured,
    isCancelled: row.isCancelled,
    category: row.category,
    tags: row.tags,
    totalCapacity: row.totalCapacity,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}