import { cacheGet, cacheSet } from '../lib/redis.js';
import {
  queryOrganizerDashboardStats,
  queryOrganizerMonthlyRevenue,
  queryEventTicketStats,
  queryEventOrders,
  queryEventAttendees,
  queryOrganizerOrders,
} from '../db/queries/analytics.queries.js';
import { queryEventById } from '../db/queries/events.queries.js';
import { ForbiddenError, NotFoundError } from '../middleware/error.middleware.js';

const STATS_CACHE_TTL = 120; // 2 minutes
const REVENUE_CACHE_TTL = 300; // 5 minutes

export async function getOrganizerDashboardStats(organizerId: string) {
  const cacheKey = `dashboard:${organizerId}:stats`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached) as ReturnType<typeof queryOrganizerDashboardStats>;

  const stats = await queryOrganizerDashboardStats(organizerId);
  await cacheSet(cacheKey, JSON.stringify(stats), STATS_CACHE_TTL);
  return stats;
}

export async function getOrganizerMonthlyRevenue(organizerId: string, months = 12) {
  const cacheKey = `dashboard:${organizerId}:revenue:${months}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached) as Awaited<ReturnType<typeof queryOrganizerMonthlyRevenue>>;

  const data = await queryOrganizerMonthlyRevenue(organizerId, months);
  await cacheSet(cacheKey, JSON.stringify(data), REVENUE_CACHE_TTL);
  return data;
}

export async function getEventAnalytics(eventId: string, organizerId: string) {
  const event = await queryEventById(eventId);
  if (!event) throw new NotFoundError('Event not found.');
  if (event.organizerId !== organizerId) throw new ForbiddenError('Access denied.');

  const ticketStats = await queryEventTicketStats(eventId);
  return { event, ticketStats };
}

export async function getEventOrdersForOrganizer(
  eventId: string,
  organizerId: string,
  page: number,
  limit: number
) {
  return queryEventOrders(eventId, organizerId, page, limit);
}

export async function getEventAttendeesForOrganizer(
  eventId: string,
  organizerId: string,
  page: number,
  limit: number,
  search?: string
) {
  return queryEventAttendees(eventId, organizerId, page, limit, search);
}

export async function getOrganizerOrderList(
  organizerId: string,
  page: number,
  limit: number,
  status?: string
) {
  return queryOrganizerOrders(organizerId, page, limit, status);
}