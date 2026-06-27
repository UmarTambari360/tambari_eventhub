'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  getRevenueChartAction,
  getRevenueBreakdownAction,
  type MonthlyRevenuePoint,
  type RevenueByOrganizer,
  type RevenueByEvent,
} from '@/actions/admin/revenue.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { RevenueSummaryCards } from '@/components/admin/revenue/revenue-summary-cards';
import { RevenueChart } from '@/components/admin/revenue/revenue-chart';
import { RevenueByOrganizerTable } from '@/components/admin/revenue/revenue-by-organizer-table';
import { RevenueByEventTable } from '@/components/admin/revenue/revenue-by-event-table';

export default function AdminRevenuePage() {
  const auth = useAuth();
  const [chart, setChart] = useState<MonthlyRevenuePoint[]>([]);
  const [byOrg, setByOrg] = useState<RevenueByOrganizer[]>([]);
  const [byEvent, setByEvent] = useState<RevenueByEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.accessToken) return;
    void (async () => {
      const [chartRes, breakdownRes] = await Promise.all([
        getRevenueChartAction(auth.accessToken!, 12),
        getRevenueBreakdownAction(auth.accessToken!),
      ]);
      if (chartRes.success && chartRes.data) setChart(chartRes.data);
      if (breakdownRes.success && breakdownRes.data) {
        setByOrg(breakdownRes.data.byOrganizer);
        setByEvent(breakdownRes.data.byEvent);
      }
      setLoading(false);
    })();
  }, [auth?.accessToken]);

  const totalEarnings = chart.reduce((s, r) => s + r.earnings, 0);
  const totalGmv = chart.reduce((s, r) => s + r.gmv, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="heading-xl text-text-primary">Platform Revenue</h1>
        <p className="text-text-secondary text-sm">EventHub's earnings from service fees</p>
      </div>

      {/* Summary Cards */}
      <RevenueSummaryCards totalEarnings={totalEarnings} totalGmv={totalGmv} />

      {/* Monthly Earnings Chart */}
      {chart.length > 0 && <RevenueChart data={chart} />}

      {/* Revenue by Organizer */}
      {byOrg.length > 0 && <RevenueByOrganizerTable organizers={byOrg} />}

      {/* Revenue by Event */}
      {byEvent.length > 0 && <RevenueByEventTable events={byEvent} />}
    </div>
  );
}
