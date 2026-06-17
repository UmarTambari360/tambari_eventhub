'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Ticket, ShoppingBag, TrendingUp, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getDashboardStatsAction, getMonthlyRevenueAction } from '@/actions/analytics.actions';
import { StatsCard } from '@/components/organizer/stats-card';
import { RevenueChart } from '@/components/organizer/revenue-chart';
import { formatNaira } from '@/lib/utils';
import type { DashboardStats, MonthlyRevenueStat } from '@/actions/analytics.actions';

export default function DashboardPage() {
  const auth = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<MonthlyRevenueStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);

  useEffect(() => {
    if (!auth?.accessToken) return;

    void (async () => {
      const [statsResult, revenueResult] = await Promise.all([
        getDashboardStatsAction(auth.accessToken!),
        getMonthlyRevenueAction(auth.accessToken!, 12),
      ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
      setLoadingStats(false);

      if (revenueResult.success && revenueResult.data) {
        setRevenue(revenueResult.data);
      }
      setLoadingRevenue(false);
    })();
  }, [auth?.accessToken]);

  const firstName = auth?.user?.fullName?.split(' ')[0] ?? 'Organizer';

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--text-primary)">Welcome back, {firstName}</h1>
        <p className="body-sm text-(--text-muted) mt-0.5">
          Here's what's happening across your events.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          label="Total Revenue"
          value={stats ? formatNaira(stats.totalRevenue) : '—'}
          subValue={`${stats?.paidOrders ?? 0} paid orders`}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loadingStats}
        />
        <StatsCard
          label="Tickets Sold"
          value={stats?.totalTicketsSold ?? '—'}
          subValue="across all events"
          icon={<Ticket className="h-4 w-4" />}
          loading={loadingStats}
        />
        <StatsCard
          label="Published Events"
          value={`${stats?.publishedEvents ?? '—'} / ${stats?.totalEvents ?? '—'}`}
          subValue="total events"
          icon={<CalendarDays className="h-4 w-4" />}
          loading={loadingStats}
        />
        <StatsCard
          label="Total Orders"
          value={stats?.totalOrders ?? '—'}
          subValue={`${stats?.paidOrders ?? 0} confirmed`}
          icon={<ShoppingBag className="h-4 w-4" />}
          loading={loadingStats}
        />
      </div>

      {/* Revenue chart */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-sm text-(--text-primary)">Revenue — Last 12 Months</h2>
          <Link href="/dashboard/orders" className="body-sm text-(--primary) hover:underline">
            View all orders →
          </Link>
        </div>
        {loadingRevenue ? (
          <div className="skeleton h-60 rounded-xl" />
        ) : (
          <RevenueChart data={revenue} />
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="caption text-(--text-muted) uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/events/create"
            className="flex items-center gap-2 btn btn-primary btn-md"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
          <Link href="/dashboard/events" className="btn btn-ghost btn-md">
            My Events
          </Link>
          <Link href="/dashboard/orders" className="btn btn-ghost btn-md">
            Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
