'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Ticket, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUserOrdersAction } from '@/actions/order.actions';
import { formatDate, formatNaira, cn } from '@/lib/utils';
import type { OrderListItemDTO, OrderStatus } from '@eventhub/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MyTicketsPage() {
  const auth = useAuth();
  const [orders, setOrders] = useState<OrderListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!auth?.accessToken) return;

    void (async () => {
      setLoading(true);
      const result = await getUserOrdersAction(auth.accessToken!, page);
      if (result.success && result.data) {
        setOrders(result.data.items);
        setTotalPages(result.data.totalPages);
      }
      setLoading(false);
    })();
  }, [auth?.accessToken, page]);

  if (!auth?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-8 border-border">
          <CardContent className="pt-6">
            <p className="heading-lg text-text-primary mb-2">Sign in to view your tickets</p>
            <Button asChild className="btn-primary">
              <Link href="/sign-in?next=/my-tickets">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="heading-xl text-text-primary">My Tickets</h1>
        <p className="body-sm text-text-muted mt-1">
          All your event registrations and ticket orders
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed border-2 border-border p-16 text-center">
          <CardContent className="pt-6">
            <Ticket className="mx-auto h-10 w-10 text-text-muted mb-4" />
            <p className="heading-sm text-text-primary mb-1">No tickets yet</p>
            <p className="body-sm text-text-muted mb-6">Browse events and get your first ticket</p>
            <Button asChild className="btn-primary">
              <Link href="/events">Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.orderNumber}`}
              className="block transition-all group"
            >
              <Card className="p-5 hover:border-primary-200 hover:shadow-card-md transition-all border-border">
                <CardContent className="p-0 flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-surface-sunken overflow-hidden">
                    {order.event.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={order.event.thumbnailUrl}
                        alt={order.event.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">🎪</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="heading-sm text-text-primary truncate group-hover:text-primary-700 transition-colors">
                        {order.event.title}
                      </p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 body-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(order.event.eventDate, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="font-medium text-brand">
                        {order.isFreeOrder ? 'FREE' : formatNaira(order.totalAmount)}
                      </span>
                      <span className="font-mono text-xs text-text-muted">{order.orderNumber}</span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-text-muted shrink-0 group-hover:text-primary-600 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4 flex justify-center gap-3 items-center">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className="border-border text-text-secondary hover:bg-surface-raised"
              >
                Previous
              </Button>
              <span className="body-sm text-text-muted">
                {page} / {totalPages}
              </span>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                size="sm"
                className="border-border text-text-secondary hover:bg-surface-raised"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<
    OrderStatus,
    {
      label: string;
      variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
    }
  > = {
    pending: { label: 'Pending', variant: 'warning' },
    processing: { label: 'Processing', variant: 'secondary' },
    paid: { label: 'Confirmed', variant: 'success' },
    failed: { label: 'Failed', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'outline' },
    refunded: { label: 'Refunded', variant: 'secondary' },
  };

  const { label, variant } = config[status];

  return (
    <Badge
      variant={variant === 'success' || variant === 'warning' ? 'default' : variant}
      className={cn(
        'shrink-0',
        variant === 'success' && 'bg-success text-white hover:bg-success/90 border-success',
        variant === 'warning' && 'bg-warning text-white hover:bg-warning/90 border-warning'
      )}
    >
      {label}
    </Badge>
  );
}
