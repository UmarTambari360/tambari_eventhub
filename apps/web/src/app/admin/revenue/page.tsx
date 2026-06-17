'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import {
  getRevenueChartAction,
  getRevenueBreakdownAction,
  type MonthlyRevenuePoint,
  type RevenueByOrganizer,
  type RevenueByEvent,
} from '@/actions/admin.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatNaira, formatDate } from '@/lib/utils';
import Link from 'next/link';

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

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-xl text-(--text-primary)">Platform Revenue</h1>
        <p className="body-sm text-(--text-muted) mt-1">EventHub's earnings from service fees</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="caption text-(--text-muted) mb-1">Platform Earnings (12mo)</p>
          <p className="text-2xl font-bold text-green-700">{formatNaira(totalEarnings)}</p>
        </div>
        <div className="card p-5">
          <p className="caption text-(--text-muted) mb-1">Total GMV (12mo)</p>
          <p className="text-2xl font-bold text-(--text-primary)">{formatNaira(totalGmv)}</p>
        </div>
        <div className="card p-5">
          <p className="caption text-(--text-muted) mb-1">Average Fee Rate</p>
          <p className="text-2xl font-bold text-(--text-primary)">
            {totalGmv > 0 ? ((totalEarnings / totalGmv) * 100).toFixed(2) : '0.00'}%
          </p>
        </div>
      </div>

      {/* Monthly earnings bar chart */}
      {chart.length > 0 && (
        <div className="card p-6">
          <h2 className="heading-sm text-(--text-primary) mb-4">Monthly Platform Earnings</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chart} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
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
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: 13,
                }}
              />
              <Bar dataKey="earnings" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By Organizer */}
      {byOrg.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-(--border)">
            <h2 className="heading-sm text-(--text-primary)">Earnings by Organizer</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-(--surface-raised)">
              <tr>
                {['Organizer', 'Transactions', 'GMV', 'Platform Fee', 'Organizer Net'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left caption text-(--text-muted)">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border)">
              {byOrg.map((row) => (
                <tr key={row.organizerId} className="hover:bg-(--surface-raised)">
                  <td className="px-5 py-3">
                    <p className="font-medium text-(--text-primary)">
                      {row.businessName ?? row.fullName}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-(--text-secondary)">{row.transactionCount}</td>
                  <td className="px-5 py-3 text-(--text-primary)">
                    {formatNaira(row.grossAmount)}
                  </td>
                  <td className="px-5 py-3 text-green-700 font-medium">
                    {formatNaira(row.platformFee)}
                  </td>
                  <td className="px-5 py-3 text-(--text-secondary)">
                    {formatNaira(row.organizerNet)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* By Event */}
      {byEvent.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-(--border)">
            <h2 className="heading-sm text-(--text-primary)">Earnings by Event</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-(--surface-raised)">
              <tr>
                {['Event', 'Date', 'Transactions', 'GMV', 'Platform Fee'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left caption text-(--text-muted)">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border)">
              {byEvent.map((row) => (
                <tr key={row.eventId} className="hover:bg-(--surface-raised)">
                  <td className="px-5 py-3">
                    <Link
                      href={`/events/${row.slug}`}
                      target="_blank"
                      className="font-medium text-(--text-primary) hover:text-(--primary) line-clamp-1"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 body-sm text-(--text-muted) whitespace-nowrap">
                    {formatDate(row.eventDate)}
                  </td>
                  <td className="px-5 py-3 text-(--text-secondary)">{row.transactionCount}</td>
                  <td className="px-5 py-3 text-(--text-primary)">
                    {formatNaira(row.grossAmount)}
                  </td>
                  <td className="px-5 py-3 text-green-700 font-medium">
                    {formatNaira(row.platformFee)}
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
