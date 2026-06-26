'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MonthlyRevenueStat } from '@/actions/analytics.actions';
import { Card, CardContent } from '@/components/ui/card';

interface RevenueChartProps {
  data: MonthlyRevenueStat[];
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year!), parseInt(month!) - 1, 1);
  return date.toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
}

function formatNairaShort(kobo: number): string {
  const naira = kobo / 100;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(0)}K`;
  return `₦${naira.toFixed(0)}`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <Card className="p-3 shadow-card-md text-sm min-w-[160px] border-border">
      <CardContent className="p-0">
        <p className="font-semibold text-text-primary mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex justify-between gap-4 items-center">
            <span className="text-text-muted">{entry.name}</span>
            <span className="font-semibold" style={{ color: entry.color }}>
              {entry.name === 'Orders' ? entry.value : formatNairaShort(entry.value)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    Revenue: d.grossRevenue,
    Orders: d.orderCount,
  }));

  const hasData = data.some((d) => d.grossRevenue > 0 || d.orderCount > 0);

  if (!hasData) {
    return (
      <Card className="border-dashed border-2 border-border">
        <CardContent className="flex h-48 items-center justify-center">
          <p className="body-sm text-text-muted">No revenue data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="revenue"
          orientation="left"
          tickFormatter={formatNairaShort}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <YAxis
          yAxisId="orders"
          orientation="right"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: 'var(--text-muted)' }}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="Revenue"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--primary)' }}
        />
        <Line
          yAxisId="orders"
          type="monotone"
          dataKey="Orders"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--accent)' }}
          strokeDasharray="4 2"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
