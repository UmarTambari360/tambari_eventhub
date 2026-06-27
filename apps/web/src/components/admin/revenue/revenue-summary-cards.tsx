'use client';

import { formatNaira } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface RevenueSummaryCardsProps {
  totalEarnings: number;
  totalGmv: number;
}

export function RevenueSummaryCards({ totalEarnings, totalGmv }: RevenueSummaryCardsProps) {
  const averageFeeRate = totalGmv > 0 ? (totalEarnings / totalGmv) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="border-border bg-surface-overlay">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
              Platform Earnings (12mo)
            </p>
          </div>
          <p className="text-2xl font-bold text-success">{formatNaira(totalEarnings)}</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-surface-overlay">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-primary-600" />
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
              Total GMV (12mo)
            </p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{formatNaira(totalGmv)}</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-surface-overlay">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="h-4 w-4 text-accent-500" />
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
              Average Fee Rate
            </p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{averageFeeRate.toFixed(2)}%</p>
        </CardContent>
      </Card>
    </div>
  );
}
