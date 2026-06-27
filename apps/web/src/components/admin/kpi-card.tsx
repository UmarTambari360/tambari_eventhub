'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  trendLabel?: string;
  color: 'primary' | 'success' | 'info' | 'warning';
}

const COLOR_MAP = {
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-success-light text-success',
  info: 'bg-info-light text-info',
  warning: 'bg-warning-light text-warning',
};

const TREND_COLOR_MAP = {
  up: 'text-success',
  down: 'text-danger',
};

export function KpiCard({ label, value, sub, icon: Icon, trend, trendLabel, color }: KpiCardProps) {
  return (
    <Card className="border-border bg-surface-overlay hover:shadow-card-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              COLOR_MAP[color]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {trend && trendLabel && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-semibold',
                TREND_COLOR_MAP[trend]
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
        <p className="text-2xl font-bold text-text-primary mb-0.5">{value}</p>
        <p className="text-xs text-text-muted">{sub}</p>
        <p className="text-xs text-text-muted font-medium mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
