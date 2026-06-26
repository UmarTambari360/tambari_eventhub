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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
        <h1 className="display-md text-text-primary">Welcome back, {firstName}</h1>
        <p className="body-sm text-text-muted mt-0.5">
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
      <Card className="p-5 mb-6 border-border">
        <CardHeader className="flex flex-row items-center justify-between p-0 mb-4">
          <CardTitle className="heading-sm text-text-primary">Revenue — Last 12 Months</CardTitle>
          <Link href="/dashboard/orders" className="body-sm text-brand hover:underline">
            View all orders →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loadingRevenue ? (
            <div className="skeleton h-60 rounded-xl" />
          ) : (
            <RevenueChart data={revenue} />
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div>
        <h2 className="caption text-text-muted uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="btn-primary">
            <Link href="/dashboard/events/create">
              <Plus className="h-4 w-4" />
              Create Event
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-border text-text-secondary hover:bg-surface-raised"
          >
            <Link href="/dashboard/events">My Events</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-border text-text-secondary hover:bg-surface-raised"
          >
            <Link href="/dashboard/orders">Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
