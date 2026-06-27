'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  CalendarDays,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getPlatformKPIsAction,
  getRevenueChartAction,
  getTopOrganizersAction,
  MonthlyRevenuePoint,
} from '@/actions/admin/revenue.actions';
import type { PlatformKPIs, TopOrganizer } from '@/actions/admin/revenue.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatNaira } from '@/lib/utils';
import { KpiCard } from '@/components/admin/kpi-card';
import { StatsCard } from '@/components/admin/stats-card';
import { TopOrganizersTable } from '@/components/admin/top-organizers-table';
import { RevenueChart } from '@/components/admin/revenue-chart';

export default function AdminDashboardPage() {
  const auth = useAuth();
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [chart, setChart] = useState<MonthlyRevenuePoint[]>([]);
  const [topOrgs, setTopOrgs] = useState<TopOrganizer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.accessToken) return;
    void (async () => {
      const [kpisRes, chartRes, orgsRes] = await Promise.all([
        getPlatformKPIsAction(auth.accessToken!),
        getRevenueChartAction(auth.accessToken!, 12),
        getTopOrganizersAction(auth.accessToken!),
      ]);
      if (kpisRes.success && kpisRes.data) setKpis(kpisRes.data);
      if (chartRes.success && chartRes.data) setChart(chartRes.data);
      if (orgsRes.success && orgsRes.data) setTopOrgs(orgsRes.data);
      setLoading(false);
    })();
  }, [auth?.accessToken]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const momUp = (kpis?.gmv.momGrowthPercent ?? 0) >= 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="heading-xl text-text-primary">Platform Dashboard</h1>
        <p className="text-text-secondary text-sm">
          Welcome back, {auth?.user?.fullName}. Here's what's happening on EventHub.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total GMV"
          value={formatNaira(kpis?.gmv.allTime ?? 0)}
          sub={`${formatNaira(kpis?.gmv.thisMonth ?? 0)} this month`}
          icon={DollarSign}
          trend={momUp ? 'up' : 'down'}
          trendLabel={`${Math.abs(kpis?.gmv.momGrowthPercent ?? 0)}% MoM`}
          color="primary"
        />
        <KpiCard
          label="Platform Earnings"
          value={formatNaira(kpis?.platformEarnings.allTime ?? 0)}
          sub={`${formatNaira(kpis?.platformEarnings.thisMonth ?? 0)} this month`}
          icon={TrendingUp}
          color="success"
        />
        <KpiCard
          label="Total Users"
          value={(kpis?.users.total ?? 0).toLocaleString()}
          sub={`+${kpis?.users.newThisMonth ?? 0} this month`}
          icon={Users}
          color="info"
        />
        <KpiCard
          label="Active Events"
          value={(kpis?.events.active ?? 0).toLocaleString()}
          sub={`${kpis?.events.thisMonth ?? 0} new this month`}
          icon={CalendarDays}
          color="warning"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          label="Approved Organizers"
          value={kpis?.users.approvedOrganizers ?? 0}
          href="/admin/users?role=organizer"
        />
        <StatsCard
          label="Pending Applications"
          value={kpis?.users.pendingApplications ?? 0}
          href="/admin/applications?status=pending"
          alert={!!kpis?.users.pendingApplications}
        />
        <StatsCard label="Tickets Sold" value={kpis?.tickets.total ?? 0} href="/admin/orders" />
        <StatsCard
          label="Events This Month"
          value={kpis?.events.thisMonth ?? 0}
          href="/admin/events"
        />
      </div>

      {/* Revenue Chart */}
      {chart.length > 0 && <RevenueChart data={chart} />}

      {/* Top Organizers */}
      {topOrgs.length > 0 && <TopOrganizersTable organizers={topOrgs} />}
    </div>
  );
}
