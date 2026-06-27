'use client';

import Link from 'next/link';
import { formatDate, formatNaira } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/status-badge';
import type { OrganizerOrder } from '@/actions/analytics.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

interface OrdersTableProps {
  orders: OrganizerOrder[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <Card className="border-border bg-surface-overlay overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-raised">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-text-muted caption font-medium">Order</TableHead>
                <TableHead className="text-text-muted caption font-medium hidden md:table-cell">
                  Event
                </TableHead>
                <TableHead className="text-text-muted caption font-medium hidden sm:table-cell">
                  Date
                </TableHead>
                <TableHead className="text-text-muted caption font-medium">Status</TableHead>
                <TableHead className="text-text-muted caption font-medium text-right">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="border-border hover:bg-surface-raised transition-colors"
                >
                  <TableCell className="py-4">
                    <div className="space-y-0.5">
                      <p className="font-mono text-xs font-medium text-text-primary">
                        {order.orderNumber}
                      </p>
                      <p className="text-text-secondary text-sm">{order.customerName}</p>
                      <p className="text-text-muted text-xs">{order.customerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 hidden md:table-cell">
                    <Link
                      href={`/events/${order.eventSlug}`}
                      className="text-text-primary hover:text-primary-600 transition-colors line-clamp-1 text-sm"
                    >
                      {order.eventTitle}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4 hidden sm:table-cell">
                    <span className="text-text-secondary text-sm whitespace-nowrap">
                      {order.paidAt ? formatDate(order.paidAt) : formatDate(order.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <StatusBadge
                      status={
                        order.status as
                          | 'paid'
                          | 'refunded'
                          | 'cancelled'
                          | 'pending'
                          | 'processing'
                          | 'failed'
                      }
                    />
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <span className="font-semibold text-text-primary">
                      {order.isFreeOrder ? 'FREE' : formatNaira(order.totalAmount)}
                    </span>
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
