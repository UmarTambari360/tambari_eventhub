'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatNaira } from '@/lib/utils';
import type { MonthlyRevenuePoint } from '@/actions/admin/revenue.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RevenueChartProps {
  data: MonthlyRevenuePoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary heading-sm">
          Platform Earnings (12 months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
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
                background: 'var(--surface-overlay)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="earnings"
              stroke="var(--primary-600)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--primary-600)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
