'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
  loading?: boolean;
}

export function StatsCard({
  label,
  value,
  subValue,
  icon,
  trend,
  className,
  loading = false,
}: StatsCardProps) {
  if (loading) {
    return (
      <div className={cn('card p-5', className)}>
        <div className="skeleton h-4 w-24 mb-3 rounded" />
        <div className="skeleton h-8 w-32 mb-1 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="caption text-(--text-muted) uppercase tracking-wide">{label}</p>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--primary-light) text-(--primary)">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-(--text-primary) tabular-nums">{value}</p>
      {subValue && <p className="body-sm text-(--text-muted) mt-0.5">{subValue}</p>}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={cn(
              'caption font-semibold',
              trend.value >= 0 ? 'text-(--success)' : 'text-(--danger)'
            )}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value.toFixed(1)}%
          </span>
          <span className="caption text-(--text-muted)">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
