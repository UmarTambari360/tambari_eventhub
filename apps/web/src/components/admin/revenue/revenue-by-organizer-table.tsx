'use client';

import { formatNaira } from '@/lib/utils';
import type { RevenueByOrganizer } from '@/actions/admin/revenue.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, CreditCard, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueByOrganizerTableProps {
  organizers: RevenueByOrganizer[];
}

export function RevenueByOrganizerTable({ organizers }: RevenueByOrganizerTableProps) {
  return (
    <Card className="border-border bg-surface-overlay overflow-hidden">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-text-primary heading-sm">Earnings by Organizer</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-raised">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-text-muted caption font-medium">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Organizer
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
                <TableHead className="text-text-muted caption font-medium text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-text-muted" />
                    Organizer Net
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizers.map((row) => (
                <TableRow
                  key={row.organizerId}
                  className="border-border hover:bg-surface-raised transition-colors"
                >
                  <TableCell className="py-3">
                    <span className="font-medium text-text-primary">
                      {row.businessName ?? row.fullName}
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
                  <TableCell className="py-3 text-right text-text-secondary">
                    {formatNaira(row.organizerNet)}
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
