import { and, desc, eq, gte, count, sql } from 'drizzle-orm';
import { db } from '../index.js';
import {
  orders,
  attendees,
  events,
  ticketTypes,
} from '../schema/index.js';

export interface MonthlyRevenueStat {
  month: string; // 'YYYY-MM'
  grossRevenue: number; // kobo
  platformFee: number; // kobo
  ticketsSold: number;
  orderCount: number;
}

export interface TicketTypeStat {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
  quantitySold: number;
  revenue: number; // kobo
}

export interface OrganizerDashboardStats {
  totalRevenue: number; // gross kobo (all time)
  totalTicketsSold: number;
  totalEvents: number;
  publishedEvents: number;
  totalOrders: number;
  paidOrders: number;
}

/**
 * Overall dashboard stats for an organizer.
 * Cached externally — this is the raw DB query.
 */
export async function queryOrganizerDashboardStats(
  organizerId: string
): Promise<OrganizerDashboardStats> {
  const [eventStats] = await db
    .select({
      totalEvents: count(),
      publishedEvents: sql<number>`cast(sum(case when is_published = true then 1 else 0 end) as integer)`,
    })
    .from(events)
    .where(eq(events.organizerId, organizerId));

  const [orderStats] = await db
    .select({
      totalOrders: count(),
      paidOrders: sql<number>`cast(sum(case when ${orders.status} = 'paid' then 1 else 0 end) as integer)`,
      totalRevenue: sql<number>`cast(coalesce(sum(case when ${orders.status} = 'paid' then ${orders.subtotal} else 0 end), 0) as integer)`,
      totalTicketsSold: sql<number>`cast(coalesce(sum(case when ${orders.status} = 'paid' then (select coalesce(sum(oi.quantity), 0) from order_items oi where oi.order_id = ${orders.id}) else 0 end), 0) as integer)`,
    })
    .from(orders)
    .innerJoin(events, eq(orders.eventId, events.id))
    .where(eq(events.organizerId, organizerId));

  return {
    totalRevenue: orderStats?.totalRevenue ?? 0,
    totalTicketsSold: orderStats?.totalTicketsSold ?? 0,
    totalEvents: eventStats?.totalEvents ?? 0,
    publishedEvents: eventStats?.publishedEvents ?? 0,
    totalOrders: orderStats?.totalOrders ?? 0,
    paidOrders: orderStats?.paidOrders ?? 0,
  };
}

/**
 * Monthly revenue breakdown for the last N months.
 * Returns data suitable for a Recharts line chart.
 */
export async function queryOrganizerMonthlyRevenue(
  organizerId: string,
  months = 12
): Promise<MonthlyRevenueStat[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - months + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      month: sql<string>`to_char(${orders.paidAt}, 'YYYY-MM')`,
      grossRevenue: sql<number>`cast(coalesce(sum(${orders.subtotal}), 0) as integer)`,
      orderCount: sql<number>`cast(count(*) as integer)`,
    })
    .from(orders)
    .innerJoin(events, eq(orders.eventId, events.id))
    .where(
      and(
        eq(events.organizerId, organizerId),
        eq(orders.status, 'paid'),
        gte(orders.paidAt, since)
      )
    )
    .groupBy(sql`to_char(${orders.paidAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${orders.paidAt}, 'YYYY-MM')`);

  // Fill gaps — ensure every month in the range has an entry
  const result: MonthlyRevenueStat[] = [];
  const cursor = new Date(since);
  const now = new Date();

  while (cursor <= now) {
    const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    const found = rows.find((r) => r.month === monthKey);
    result.push({
      month: monthKey,
      grossRevenue: found?.grossRevenue ?? 0,
      platformFee: 0, // filled from platform_ledger below if needed
      ticketsSold: 0, // filled separately
      orderCount: found?.orderCount ?? 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
}

/**
 * Per-ticket-type sales stats for a specific event.
 */
export async function queryEventTicketStats(eventId: string): Promise<TicketTypeStat[]> {
  const rows = await db
    .select({
      ticketTypeId: ticketTypes.id,
      name: ticketTypes.name,
      price: ticketTypes.price,
      quantity: ticketTypes.quantity,
      quantitySold: ticketTypes.quantitySold,
    })
    .from(ticketTypes)
    .where(eq(ticketTypes.eventId, eventId))
    .orderBy(ticketTypes.createdAt);

  return rows.map((r) => ({
    ...r,
    revenue: r.price * r.quantitySold,
  }));
}

/**
 * Paginated orders for a specific event (organizer view).
 */
export async function queryEventOrders(
  eventId: string,
  organizerId: string,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;

  // Verify ownership
  const [event] = await db
    .select({ organizerId: events.organizerId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || event.organizerId !== organizerId) return { rows: [], total: 0 };

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        status: orders.status,
        isFreeOrder: orders.isFreeOrder,
        subtotal: orders.subtotal,
        serviceFee: orders.serviceFee,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        paidAt: orders.paidAt,
      })
      .from(orders)
      .where(and(eq(orders.eventId, eventId), eq(orders.status, 'paid')))
      .orderBy(desc(orders.paidAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ total: count() })
      .from(orders)
      .where(and(eq(orders.eventId, eventId), eq(orders.status, 'paid'))),
  ]);

  return { rows, total: countResult[0]?.total ?? 0 };
}

/**
 * Paginated attendees for a specific event (organizer view).
 */
export async function queryEventAttendees(
  eventId: string,
  organizerId: string,
  page: number,
  limit: number,
  search?: string
) {
  const offset = (page - 1) * limit;

  const [event] = await db
    .select({ organizerId: events.organizerId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || event.organizerId !== organizerId) return { rows: [], total: 0 };

  const baseWhere = and(
    eq(attendees.eventId, eventId),
    search
      ? sql`(${attendees.firstName} ilike ${'%' + search + '%'} or ${attendees.lastName} ilike ${'%' + search + '%'} or ${attendees.email} ilike ${'%' + search + '%'} or ${attendees.ticketCode} ilike ${'%' + search + '%'})`
      : undefined
  );

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: attendees.id,
        ticketCode: attendees.ticketCode,
        firstName: attendees.firstName,
        lastName: attendees.lastName,
        email: attendees.email,
        phoneNumber: attendees.phoneNumber,
        isCheckedIn: attendees.isCheckedIn,
        checkedInAt: attendees.checkedInAt,
        isRevoked: attendees.isRevoked,
        qrCodeUrl: attendees.qrCodeUrl,
        ticketTypeId: attendees.ticketTypeId,
        ticketTypeName: ticketTypes.name,
        orderNumber: orders.orderNumber,
      })
      .from(attendees)
      .leftJoin(ticketTypes, eq(attendees.ticketTypeId, ticketTypes.id))
      .leftJoin(orders, eq(attendees.orderId, orders.id))
      .where(baseWhere)
      .orderBy(desc(attendees.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ total: count() }).from(attendees).where(baseWhere),
  ]);

  return { rows, total: countResult[0]?.total ?? 0 };
}

/**
 * Organizer's paginated order list (across all events).
 */
export async function queryOrganizerOrders(
  organizerId: string,
  page: number,
  limit: number,
  status?: string
) {
  const offset = (page - 1) * limit;

  const whereClause = and(
    eq(events.organizerId, organizerId),
    status ? eq(orders.status, status as 'paid' | 'pending' | 'refunded' | 'cancelled' | 'failed' | 'processing') : undefined
  );

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        status: orders.status,
        isFreeOrder: orders.isFreeOrder,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        paidAt: orders.paidAt,
        eventId: events.id,
        eventTitle: events.title,
        eventSlug: events.slug,
      })
      .from(orders)
      .innerJoin(events, eq(orders.eventId, events.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ total: count() })
      .from(orders)
      .innerJoin(events, eq(orders.eventId, events.id))
      .where(whereClause),
  ]);

  return { rows, total: countResult[0]?.total ?? 0 };
}