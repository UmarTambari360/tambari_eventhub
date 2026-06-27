'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: number;
  href: string;
  alert?: boolean;
}

export function StatsCard({ label, value, href, alert = false }: StatCardProps) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          'border-border bg-surface-overlay hover:border-primary-200 hover:shadow-card-md transition-all cursor-pointer',
          alert && 'border-warning-200 bg-warning-light'
        )}
      >
        <CardContent className="p-4">
          <p className={cn('text-2xl font-bold', alert ? 'text-warning' : 'text-text-primary')}>
            {value.toLocaleString()}
          </p>
          <p
            className={cn(
              'text-sm mt-0.5 flex items-center gap-1',
              alert ? 'text-warning' : 'text-text-muted'
            )}
          >
            {label}
            {alert && <AlertCircle className="h-3.5 w-3.5" />}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
