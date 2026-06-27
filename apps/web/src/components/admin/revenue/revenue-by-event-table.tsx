'use client';

import Link from 'next/link';
import { formatDate, formatNaira } from '@/lib/utils';
import type { RevenueByEvent } from '@/actions/admin/revenue.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, CreditCard, DollarSign, TrendingUp, Hash } from 'lucide-react';

interface RevenueByEventTableProps {
  events: RevenueByEvent[];
}

export function RevenueByEventTable({ events }: RevenueByEventTableProps) {
  return (
    <Card className="border-border bg-surface-overlay overflow-hidden">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-text-primary heading-sm">Earnings by Event</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-raised">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-text-muted caption font-medium">
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    Event
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Transactions
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    GMV
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                    Platform Fee
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((row) => (
                <TableRow
                  key={row.eventId}
                  className="border-border hover:bg-surface-raised transition-colors group"
                >
                  <TableCell className="py-3">
                    <Link
                      href={`/events/${row.slug}`}
                      target="_blank"
                      className="font-medium text-text-primary hover:text-primary-600 transition-colors line-clamp-1 max-w-[200px]"
                    >
                      {row.title}
                    </Link>
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    <span className="text-text-muted text-sm whitespace-nowrap">
                      {formatDate(row.eventDate)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center text-text-secondary">
                    {row.transactionCount}
                  </TableCell>
                  <TableCell className="py-3 text-right text-text-primary">
                    {formatNaira(row.grossAmount)}
                  </TableCell>
                  <TableCell className="py-3 text-right font-medium text-success">
                    {formatNaira(row.platformFee)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
