'use client';

import { formatNaira } from '@/lib/utils';
import { StatsCard } from './stats-card';
import type { TicketTypeStat } from '@/actions/analytics.actions';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EventStatsProps {
  ticketStats: TicketTypeStat[];
  loading: boolean;
}

export function EventStats({ ticketStats, loading }: EventStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatsCard key={i} label="" value="" loading />
        ))}
      </div>
    );
  }

  if (ticketStats.length === 0) {
    return (
      <Card className="border-dashed border-2 border-border p-12 text-center">
        <CardContent className="pt-6">
          <p className="body-sm text-text-muted">No ticket sales yet</p>
        </CardContent>
      </Card>
    );
  }

  const totalSold = ticketStats.reduce((s, t) => s + t.quantitySold, 0);
  const totalCapacity = ticketStats.reduce((s, t) => s + t.quantity, 0);
  const totalRevenue = ticketStats.reduce((s, t) => s + t.revenue, 0);
  const sellThrough = Math.round((totalSold / Math.max(totalCapacity, 1)) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard label="Total Sold" value={totalSold} subValue={`of ${totalCapacity} capacity`} />
        <StatsCard label="Gross Revenue" value={formatNaira(totalRevenue)} />
        <StatsCard label="Ticket Types" value={ticketStats.length} />
        <StatsCard label="Sell-Through" value={`${sellThrough}%`} />
      </div>

      <Card className="overflow-hidden border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-surface-raised">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="caption text-text-muted">Ticket Type</TableHead>
                <TableHead className="caption text-text-muted text-right">Price</TableHead>
                <TableHead className="caption text-text-muted text-right">Sold</TableHead>
                <TableHead className="caption text-text-muted text-right">Available</TableHead>
                <TableHead className="caption text-text-muted text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketStats.map((tt) => (
                <TableRow key={tt.ticketTypeId} className="border-border hover:bg-surface-raised/50">
                  <TableCell className="heading-sm text-text-primary">{tt.name}</TableCell>
                  <TableCell className="text-right body-sm text-text-secondary">
                    {tt.price === 0 ? 'FREE' : formatNaira(tt.price)}
                  </TableCell>
                  <TableCell className="text-right body-sm font-semibold text-text-primary">
                    {tt.quantitySold}
                  </TableCell>
                  <TableCell className="text-right body-sm text-text-secondary">
                    {tt.quantity - tt.quantitySold}
                  </TableCell>
                  <TableCell className="text-right body-sm font-semibold text-brand">
                    {tt.price === 0 ? '—' : formatNaira(tt.revenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}