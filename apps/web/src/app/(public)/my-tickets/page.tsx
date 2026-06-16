'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Ticket, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUserOrdersAction } from '@/actions/order.actions';
import { formatDate, formatNaira, cn } from '@/lib/utils';
import type { OrderListItemDTO, OrderStatus } from '@eventhub/types';

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
        <div className="text-center">
          <p className="heading-lg text-(--text-primary) mb-2">Sign in to view your tickets</p>
          <Link href="/sign-in?next=/my-tickets" className="btn btn-primary btn-md">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="heading-xl text-(--text-primary)">My Tickets</h1>
        <p className="body-sm text-(--text-muted) mt-1">
          All your event registrations and ticket orders
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card border-dashed p-16 text-center">
          <Ticket className="mx-auto h-10 w-10 text-(--text-muted) mb-4" />
          <p className="heading-sm text-(--text-primary) mb-1">No tickets yet</p>
          <p className="body-sm text-(--text-muted) mb-6">
            Browse events and get your first ticket
          </p>
          <Link href="/events" className="btn btn-primary btn-md">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.orderNumber}`}
              className="card p-5 flex items-center gap-4 hover:border-violet-200 hover:shadow-card-md transition-all group"
            >
              {/* Thumbnail */}
              <div className="h-16 w-16 shrink-0 rounded-xl bg-(--surface-sunken) overflow-hidden">
                {order.event.thumbnailUrl ? (
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
                  <p className="heading-sm text-(--text-primary) truncate group-hover:text-violet-700 transition-colors">
                    {order.event.title}
                  </p>
                  <OrderStatusPill status={order.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 body-sm text-(--text-muted)">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(order.event.eventDate, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="font-medium text-(--primary)">
                    {order.isFreeOrder ? 'FREE' : formatNaira(order.totalAmount)}
                  </span>
                  <span className="font-mono text-xs text-(--text-muted)">{order.orderNumber}</span>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-(--text-muted) shrink-0 group-hover:text-violet-600 transition-colors" />
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-ghost btn-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="body-sm text-(--text-muted) py-1.5">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-ghost btn-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderStatusPill({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'badge badge-warning' },
    processing: { label: 'Processing', cls: 'badge badge-primary' },
    paid: { label: 'Confirmed', cls: 'badge badge-success' },
    failed: { label: 'Failed', cls: 'badge badge-danger' },
    cancelled: { label: 'Cancelled', cls: 'badge badge-neutral' },
    refunded: { label: 'Refunded', cls: 'badge badge-info' },
  };
  const { label, cls } = config[status];
  return <span className={cn(cls, 'shrink-0')}>{label}</span>;
}
