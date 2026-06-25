'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CalendarDays,
  DollarSign,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { 
  getPlatformKPIsAction,
  getRevenueChartAction,
  MonthlyRevenuePoint
} from '@/actions/admin/revenue.actions'
import type { 
  PlatformKPIs, 
  TopOrganizer }        from '@/actions/admin/revenue.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatNaira, cn } from '@/lib/utils';

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
      <div>
        <h1 className="heading-xl text-(--text-primary)">Platform Dashboard</h1>
        <p className="body-sm text-(--text-muted) mt-1">
          Welcome back, {auth?.user?.fullName}. Here's what's happening on EventHub.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total GMV"
          value={formatNaira(kpis?.gmv.allTime ?? 0)}
          sub={`${formatNaira(kpis?.gmv.thisMonth ?? 0)} this month`}
          icon={DollarSign}
          trend={momUp ? 'up' : 'down'}
          trendLabel={`${Math.abs(kpis?.gmv.momGrowthPercent ?? 0)}% MoM`}
          color="violet"
        />
        <KpiCard
          label="Platform Earnings"
          value={formatNaira(kpis?.platformEarnings.allTime ?? 0)}
          sub={`${formatNaira(kpis?.platformEarnings.thisMonth ?? 0)} this month`}
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          label="Total Users"
          value={(kpis?.users.total ?? 0).toLocaleString()}
          sub={`+${kpis?.users.newThisMonth ?? 0} this month`}
          icon={Users}
          color="blue"
        />
        <KpiCard
          label="Active Events"
          value={(kpis?.events.active ?? 0).toLocaleString()}
          sub={`${kpis?.events.thisMonth ?? 0} new this month`}
          icon={CalendarDays}
          color="amber"
        />
      </div>

      {/* ── Secondary stat row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Approved Organizers',
            value: kpis?.users.approvedOrganizers ?? 0,
            href: '/admin/users?role=organizer',
          },
          {
            label: 'Pending Applications',
            value: kpis?.users.pendingApplications ?? 0,
            href: '/admin/applications?status=pending',
            alert: (kpis?.users.pendingApplications ?? 0) > 0,
          },
          { label: 'Tickets Sold', value: kpis?.tickets.total ?? 0, href: '/admin/orders' },
          { label: 'Events This Month', value: kpis?.events.thisMonth ?? 0, href: '/admin/events' },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={cn(
              'card p-4 hover:border-violet-200 hover:shadow-card-md transition-all',
              stat.alert && 'border-amber-200 bg-amber-50'
            )}
          >
            <p
              className={cn(
                'text-2xl font-bold',
                stat.alert ? 'text-amber-700' : 'text-(--text-primary)'
              )}
            >
              {stat.value.toLocaleString()}
            </p>
            <p
              className={cn(
                'body-sm mt-0.5',
                stat.alert ? 'text-amber-700' : 'text-(--text-muted)'
              )}
            >
              {stat.label}
              {stat.alert && ' ⚠️'}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Revenue Chart ── */}
      {chart.length > 0 && (
        <div className="card p-6">
          <h2 className="heading-sm text-(--text-primary) mb-4">Platform Earnings (12 months)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chart} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tickFormatter={(v: string) => {
                  const [year, month] = v.split('-');
                  return new Date(Number(year), Number(month) - 1).toLocaleString('default', {
                    month: 'short',
                  });
                }}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `₦${(v / 100000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(value: number) => [formatNaira(value), 'Earnings']}
                labelFormatter={(label: string) => {
                  const [year, month] = label.split('-');
                  return new Date(Number(year), Number(month) - 1).toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  });
                }}
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Top Organizers ── */}
      {topOrgs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-(--border) flex items-center justify-between">
            <h2 className="heading-sm text-(--text-primary)">Top Organizers by GMV</h2>
            <Link
              href="/admin/revenue"
              className="body-sm text-(--primary) font-medium hover:underline"
            >
              View revenue →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-(--surface-raised)">
              <tr>
                {['Organizer', 'Events', 'GMV', 'Platform Fee', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left caption text-(--text-muted)">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border)">
              {topOrgs.slice(0, 8).map((org) => (
                <tr key={org.id} className="hover:bg-(--surface-raised)">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/users/${org.id}`}
                      className="font-medium text-(--text-primary) hover:text-(--primary)"
                    >
                      {org.businessName || org.fullName}
                    </Link>
                    <p className="caption text-(--text-muted)">{org.email}</p>
                  </td>
                  <td className="px-5 py-3 text-(--text-secondary)">{org.eventsCount}</td>
                  <td className="px-5 py-3 font-medium text-(--text-primary)">
                    {formatNaira(org.totalGmv)}
                  </td>
                  <td className="px-5 py-3 text-green-700 font-medium">
                    {formatNaira(org.platformFee)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'badge',
                        org.status === 'approved' ? 'badge-success' : 'badge-neutral'
                      )}
                    >
                      {org.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  trendLabel,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  trendLabel?: string;
  color: 'violet' | 'green' | 'blue' | 'amber';
}) {
  const colorMap = {
    violet: 'bg-violet-100 text-violet-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colorMap[color])}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && trendLabel && (
          <div
            className={cn(
              'flex items-center gap-1 body-sm font-semibold',
              trend === 'up' ? 'text-green-600' : 'text-red-500'
            )}
          >
            {trend === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trendLabel}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-(--text-primary) mb-0.5">{value}</p>
      <p className="caption text-(--text-muted)">{sub}</p>
      <p className="caption text-(--text-muted) font-medium mt-1">{label}</p>
    </div>
  );
}
function getTopOrganizersAction(arg0: string): any {
  throw new Error('Function not implemented.');
}

