'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getOrganizerOrdersAction } from '@/actions/analytics.actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate, formatNaira } from '@/lib/utils';
import type { OrganizerOrder } from '@/actions/analytics.actions';

type StatusFilter = 'all' | 'paid' | 'refunded' | 'cancelled';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function DashboardOrdersPage() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = (searchParams.get('status') ?? 'all') as StatusFilter;

  const [orders, setOrders] = useState<OrganizerOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.accessToken) return;
    setLoading(true);
    void (async () => {
      const result = await getOrganizerOrdersAction(
        auth.accessToken!,
        page,
        statusParam === 'all' ? undefined : statusParam
      );
      if (result.success && result.data) {
        setOrders(result.data.items);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
      setLoading(false);
    })();
  }, [auth?.accessToken, page, statusParam]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--text-primary)">Orders</h1>
        <p className="body-sm text-(--text-muted) mt-0.5">All ticket orders across your events</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 border-b border-(--border)">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              router.push(`/dashboard/orders?status=${tab.value}`);
              setPage(1);
            }}
            className={`px-4 py-2.5 body-sm font-medium border-b-2 transition-colors -mb-px ${
              statusParam === tab.value
                ? 'border-(--primary) text-(--primary)'
                : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card border-dashed p-12 text-center">
          <p className="body-sm text-(--text-muted)">No orders found.</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-(--surface-raised) border-b border-(--border)">
                <tr>
                  <th className="px-5 py-3 text-left caption text-(--text-muted)">Order</th>
                  <th className="px-5 py-3 text-left caption text-(--text-muted) hidden md:table-cell">
                    Event
                  </th>
                  <th className="px-5 py-3 text-left caption text-(--text-muted) hidden sm:table-cell">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left caption text-(--text-muted)">Status</th>
                  <th className="px-5 py-3 text-right caption text-(--text-muted)">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-(--surface-raised) transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-(--text-primary) font-mono text-xs">
                        {order.orderNumber}
                      </p>
                      <p className="caption text-(--text-muted) mt-0.5">{order.customerName}</p>
                      <p className="caption text-(--text-muted)">{order.customerEmail}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <Link
                        href={`/events/${order.eventSlug}`}
                        className="body-sm text-(--primary) hover:underline line-clamp-1"
                      >
                        {order.eventTitle}
                      </Link>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell body-sm text-(--text-muted) whitespace-nowrap">
                      {order.paidAt ? formatDate(order.paidAt) : formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-4">
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
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-(--text-primary)">
                        {order.isFreeOrder ? 'FREE' : formatNaira(order.totalAmount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between body-sm text-(--text-muted)">
              <span>
                Showing {orders.length} of {total} orders
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-ghost btn-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5">
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
