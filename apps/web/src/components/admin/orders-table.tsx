'use client';

import Link from 'next/link';
import { formatDate, formatNaira } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/status-badge';
import type { AdminOrderRow } from '@/actions/admin/orders.actions';
import type { OrderStatus } from '@eventhub/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, User, Mail, DollarSign, Hash } from 'lucide-react';

interface AdminOrdersTableProps {
  orders: AdminOrderRow[];
}

export function AdminOrdersTable({ orders }: AdminOrdersTableProps) {
  return (
    <Card className="border-border bg-surface-overlay overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-raised">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-text-muted caption font-medium">
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    Order
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Customer
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium hidden lg:table-cell">
                  Event
                </TableHead>
                <TableHead className="text-text-muted caption font-medium">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    Amount
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium">Status</TableHead>
                <TableHead className="text-text-muted caption font-medium hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="border-border hover:bg-surface-raised transition-colors group"
                >
                  <TableCell className="py-3">
                    <span className="font-mono text-xs font-medium text-text-primary">
                      {order.orderNumber}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="space-y-0.5">
                      <p className="text-text-primary text-sm font-medium">{order.customerName}</p>
                      <div className="flex items-center gap-1 text-text-muted text-xs">
                        <Mail className="h-3 w-3" />
                        {order.customerEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 hidden lg:table-cell">
                    <span className="text-text-secondary text-sm line-clamp-1 max-w-[200px]">
                      {order.eventTitle ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="font-semibold text-text-primary">
                      {order.isFreeOrder ? 'FREE' : formatNaira(order.totalAmount)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusBadge status={order.status as OrderStatus} />
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    <span className="text-text-muted text-sm whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 group-hover:bg-primary-50"
                    >
                      <Link href={`/admin/orders/${order.id}`}>
                        View
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
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
