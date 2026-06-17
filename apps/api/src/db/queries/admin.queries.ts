import { and, count, desc, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { db } from '../index.js';
import {
  users,
  events,
  orders,
  transactions,
  platformLedger,
  organizerProfiles,
  organizerApplications,
  attendees,
} from '../schema/index.js';

// ─── Platform KPIs ────────────────────────────────────────────────────────────

export async function queryPlatformKPIs() {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalGmv,
    gmvThisMonth,
    gmvLastMonth,
    platformEarningsAllTime,
    platformEarningsThisMonth,
    totalUsers,
    newUsersThisMonth,
    totalOrganizers,
    pendingApplications,
    totalEvents,
    activeEvents,
    eventsThisMonth,
    totalTicketsSold,
    ticketsSoldThisMonth,
  ] = await Promise.all([
    // Total GMV (all paid orders)
    db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.status, 'paid'))
      .then((r) => Number(r[0]?.total ?? 0)),

    // GMV this month
    db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(and(eq(orders.status, 'paid'), gte(orders.paidAt, startOfThisMonth)))
      .then((r) => Number(r[0]?.total ?? 0)),

    // GMV last month
    db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'paid'),
          gte(orders.paidAt, startOfLastMonth),
          lte(orders.paidAt, endOfLastMonth)
        )
      )
      .then((r) => Number(r[0]?.total ?? 0)),

    // Platform earnings (service fees) all time
    db
      .select({ total: sum(platformLedger.platformFee) })
      .from(platformLedger)
      .where(eq(platformLedger.isReversed, false))
      .then((r) => Number(r[0]?.total ?? 0)),

    // Platform earnings this month
    db
      .select({ total: sum(platformLedger.platformFee) })
      .from(platformLedger)
      .where(
        and(
          eq(platformLedger.isReversed, false),
          gte(platformLedger.createdAt, startOfThisMonth)
        )
      )
      .then((r) => Number(r[0]?.total ?? 0)),

    // Total users
    db
      .select({ count: count() })
      .from(users)
      .then((r) => r[0]?.count ?? 0),

    // New users this month
    db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, startOfThisMonth))
      .then((r) => r[0]?.count ?? 0),

    // Total approved organizers
    db
      .select({ count: count() })
      .from(organizerProfiles)
      .where(eq(organizerProfiles.status, 'approved'))
      .then((r) => r[0]?.count ?? 0),

    // Pending applications
    db
      .select({ count: count() })
      .from(organizerApplications)
      .where(eq(organizerApplications.status, 'pending'))
      .then((r) => r[0]?.count ?? 0),

    // Total events (published, not cancelled)
    db
      .select({ count: count() })
      .from(events)
      .where(and(eq(events.isPublished, true), eq(events.isCancelled, false)))
      .then((r) => r[0]?.count ?? 0),

    // Active events (published, not cancelled, date in future)
    db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          eq(events.isPublished, true),
          eq(events.isCancelled, false),
          gte(events.eventDate, now)
        )
      )
      .then((r) => r[0]?.count ?? 0),

    // Events created this month
    db
      .select({ count: count() })
      .from(events)
      .where(gte(events.createdAt, startOfThisMonth))
      .then((r) => r[0]?.count ?? 0),

    // Total tickets sold (attendees)
    db
      .select({ count: count() })
      .from(attendees)
      .then((r) => r[0]?.count ?? 0),

    // Tickets sold this month
    db
      .select({ count: count() })
      .from(attendees)
      .where(gte(attendees.createdAt, startOfThisMonth))
      .then((r) => r[0]?.count ?? 0),
  ]);

  const momGrowthPercent =
    gmvLastMonth > 0
      ? Math.round(((gmvThisMonth - gmvLastMonth) / gmvLastMonth) * 100 * 10) / 10
      : gmvThisMonth > 0
        ? 100
        : 0;

  return {
    gmv: {
      allTime: totalGmv,
      thisMonth: gmvThisMonth,
      lastMonth: gmvLastMonth,
      momGrowthPercent,
    },
    platformEarnings: {
      allTime: platformEarningsAllTime,
      thisMonth: platformEarningsThisMonth,
    },
    users: {
      total: totalUsers,
      newThisMonth: newUsersThisMonth,
      approvedOrganizers: totalOrganizers,
      pendingApplications,
    },
    events: {
      total: totalEvents,
      active: activeEvents,
      thisMonth: eventsThisMonth,
    },
    tickets: {
      total: totalTicketsSold,
      thisMonth: ticketsSoldThisMonth,
    },
  };
}

// ─── Monthly platform earnings chart (12 months) ─────────────────────────────

export async function queryMonthlyPlatformEarnings(months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const rows = await db.execute(sql`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      SUM(platform_fee) AS earnings,
      SUM(gross_amount) AS gmv,
      COUNT(*) AS transactions
    FROM platform_ledger
    WHERE created_at >= ${startDate}
      AND is_reversed = false
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month ASC
  `) as unknown as Array<{
    month: Date;
    earnings: string;
    gmv: string;
    transactions: string;
  }>;

  return rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7), // "2025-08"
    earnings: Number(r.earnings ?? 0),
    gmv: Number(r.gmv ?? 0),
    transactions: Number(r.transactions ?? 0),
  }));
}

// ─── Top organizers by GMV ────────────────────────────────────────────────────

export async function queryTopOrganizers(limit = 10) {
  const rows = await db.execute(sql`
    SELECT
      u.id,
      u.full_name,
      u.email,
      op.business_name,
      op.status,
      COUNT(DISTINCT e.id) AS events_count,
      COALESCE(SUM(pl.gross_amount), 0) AS total_gmv,
      COALESCE(SUM(pl.organizer_net), 0) AS organizer_net,
      COALESCE(SUM(pl.platform_fee), 0) AS platform_fee
    FROM organizer_profiles op
    INNER JOIN users u ON u.id = op.user_id
    LEFT JOIN events e ON e.organizer_id = u.id
    LEFT JOIN platform_ledger pl ON pl.organizer_id = u.id AND pl.is_reversed = false
    GROUP BY u.id, u.full_name, u.email, op.business_name, op.status
    ORDER BY total_gmv DESC
    LIMIT ${limit}
  `) as unknown as Array<{
    id: string;
    full_name: string;
    email: string;
    business_name: string;
    status: string;
    events_count: string;
    total_gmv: string;
    organizer_net: string;
    platform_fee: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    businessName: r.business_name,
    status: r.status,
    eventsCount: Number(r.events_count),
    totalGmv: Number(r.total_gmv),
    organizerNet: Number(r.organizer_net),
    platformFee: Number(r.platform_fee),
  }));
}

// ─── Recent transactions ──────────────────────────────────────────────────────

export async function queryRecentTransactions(limit = 20) {
  const rows = await db
    .select({
      id: transactions.id,
      reference: transactions.reference,
      amount: transactions.amount,
      platformFee: transactions.platformFee,
      organizerAmount: transactions.organizerAmount,
      status: transactions.status,
      channel: transactions.channel,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
      customerEmail: transactions.email,
      orderId: transactions.orderId,
    })
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(limit);

  return rows;
}

// ─── All users (paginated) ────────────────────────────────────────────────────

export async function queryAllUsers(
  page: number,
  limit: number,
  filters: { role?: string; isSuspended?: boolean; search?: string }
) {
  const offset = (page - 1) * limit;

  const conditions = [];
  if (filters.role) conditions.push(eq(users.role, filters.role as 'attendee' | 'organizer' | 'admin'));
  if (filters.isSuspended !== undefined) conditions.push(eq(users.isSuspended, filters.isSuspended));
  if (filters.search) {
    conditions.push(
      sql`(${users.fullName} ILIKE ${'%' + filters.search + '%'} OR ${users.email} ILIKE ${'%' + filters.search + '%'})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isSuspended: users.isSuspended,
        suspendedAt: users.suspendedAt,
        suspendedReason: users.suspendedReason,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ count: count() }).from(users).where(where),
  ]);

  return { rows, total: countResult[0]?.count ?? 0 };
}

// ─── User detail ──────────────────────────────────────────────────────────────

export async function queryUserDetail(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const [profile, orderCount, eventCount] = await Promise.all([
    db
      .select()
      .from(organizerProfiles)
      .where(eq(organizerProfiles.userId, userId))
      .limit(1)
      .then((r) => r[0] ?? null),

    db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.userId, userId))
      .then((r) => r[0]?.count ?? 0),

    user.role === 'organizer'
      ? db
          .select({ count: count() })
          .from(events)
          .where(eq(events.organizerId, userId))
          .then((r) => r[0]?.count ?? 0)
      : Promise.resolve(0),
  ]);

  return { user, profile, orderCount, eventCount };
}

// ─── All events (paginated) ───────────────────────────────────────────────────

export async function queryAllEvents(
  page: number,
  limit: number,
  filters: { isPublished?: boolean; isCancelled?: boolean; search?: string }
) {
  const offset = (page - 1) * limit;

  const conditions = [];
  if (filters.isPublished !== undefined) conditions.push(eq(events.isPublished, filters.isPublished));
  if (filters.isCancelled !== undefined) conditions.push(eq(events.isCancelled, filters.isCancelled));
  if (filters.search) {
    conditions.push(sql`${events.title} ILIKE ${'%' + filters.search + '%'}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        location: events.location,
        eventDate: events.eventDate,
        isPublished: events.isPublished,
        isFeatured: events.isFeatured,
        featureOrder: events.featureOrder,
        isCancelled: events.isCancelled,
        isFree: events.isFree,
        category: events.category,
        createdAt: events.createdAt,
        organizerId: events.organizerId,
        organizerName: users.fullName,
        organizerBusiness: organizerProfiles.businessName,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(organizerProfiles, eq(events.organizerId, organizerProfiles.userId))
      .where(where)
      .orderBy(desc(events.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ count: count() }).from(events).where(where),
  ]);

  return { rows, total: countResult[0]?.count ?? 0 };
}

// ─── All orders (paginated) ───────────────────────────────────────────────────

export async function queryAllOrders(
  page: number,
  limit: number,
  filters: { status?: string; search?: string }
) {
  const offset = (page - 1) * limit;

  const conditions = [];
  if (filters.status) conditions.push(eq(orders.status, filters.status as 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded'));
  if (filters.search) {
    conditions.push(
      sql`(${orders.orderNumber} ILIKE ${'%' + filters.search + '%'} OR ${orders.customerEmail} ILIKE ${'%' + filters.search + '%'})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        isFreeOrder: orders.isFreeOrder,
        totalAmount: orders.totalAmount,
        serviceFee: orders.serviceFee,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        paidAt: orders.paidAt,
        createdAt: orders.createdAt,
        eventId: orders.eventId,
        eventTitle: events.title,
        eventSlug: events.slug,
      })
      .from(orders)
      .leftJoin(events, eq(orders.eventId, events.id))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ count: count() }).from(orders).where(where),
  ]);

  return { rows, total: countResult[0]?.count ?? 0 };
}

// ─── Platform revenue by organizer ───────────────────────────────────────────

export async function queryRevenueByOrganizer(limit = 20) {
  const rows = await db.execute(sql`
    SELECT
      pl.organizer_id,
      u.full_name,
      op.business_name,
      COUNT(*) AS transaction_count,
      SUM(pl.gross_amount) AS gross_amount,
      SUM(pl.platform_fee) AS platform_fee,
      SUM(pl.organizer_net) AS organizer_net
    FROM platform_ledger pl
    INNER JOIN users u ON u.id = pl.organizer_id
    LEFT JOIN organizer_profiles op ON op.user_id = pl.organizer_id
    WHERE pl.is_reversed = false
    GROUP BY pl.organizer_id, u.full_name, op.business_name
    ORDER BY platform_fee DESC
    LIMIT ${limit}
  `) as unknown as Array<{
    organizer_id: string;
    full_name: string;
    business_name: string | null;
    transaction_count: string;
    gross_amount: string;
    platform_fee: string;
    organizer_net: string;
  }>;

  return rows.map((r) => ({
    organizerId: r.organizer_id,
    fullName: r.full_name,
    businessName: r.business_name,
    transactionCount: Number(r.transaction_count),
    grossAmount: Number(r.gross_amount),
    platformFee: Number(r.platform_fee),
    organizerNet: Number(r.organizer_net),
  }));
}

// ─── Platform revenue by event ────────────────────────────────────────────────

export async function queryRevenueByEvent(limit = 20) {
  const rows = await db.execute(sql`
    SELECT
      pl.event_id,
      e.title,
      e.slug,
      e.event_date,
      COUNT(*) AS transaction_count,
      SUM(pl.gross_amount) AS gross_amount,
      SUM(pl.platform_fee) AS platform_fee
    FROM platform_ledger pl
    INNER JOIN events e ON e.id = pl.event_id
    WHERE pl.is_reversed = false
    GROUP BY pl.event_id, e.title, e.slug, e.event_date
    ORDER BY platform_fee DESC
    LIMIT ${limit}
  `) as unknown as Array<{
    event_id: string;
    title: string;
    slug: string;
    event_date: Date;
    transaction_count: string;
    gross_amount: string;
    platform_fee: string;
  }>;

  return rows.map((r) => ({
    eventId: r.event_id,
    title: r.title,
    slug: r.slug,
    eventDate: r.event_date.toISOString(),
    transactionCount: Number(r.transaction_count),
    grossAmount: Number(r.gross_amount),
    platformFee: Number(r.platform_fee),
  }));
}

// ─── Order detail (admin — all orders) ───────────────────────────────────────

export async function queryOrderDetailForAdmin(orderId: string) {
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      isFreeOrder: orders.isFreeOrder,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      subtotal: orders.subtotal,
      serviceFee: orders.serviceFee,
      totalAmount: orders.totalAmount,
      notes: orders.notes,
      paidAt: orders.paidAt,
      cancelledAt: orders.cancelledAt,
      refundedAt: orders.refundedAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userId: orders.userId,
      eventId: orders.eventId,
      eventTitle: events.title,
      eventSlug: events.slug,
      eventDate: events.eventDate,
    })
    .from(orders)
    .leftJoin(events, eq(orders.eventId, events.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  return order ?? null;
}