'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getAdminOrdersAction, type AdminOrderRow } from '@/actions/admin.actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate, formatNaira, cn } from '@/lib/utils';
import type { OrderStatus } from '@eventhub/types';

type StatusFilter = 'all' | 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled';

export default function AdminOrdersPage() {
  const auth = useAuth();
  const [orderList, setOrderList] = useState<AdminOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('paid');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!auth?.accessToken) return;
    setLoading(true);
    void (async () => {
      const params: { page?: number; status?: string; search?: string } = { page };
      if (status !== 'all') {
        params.status = status;
      }
      if (search) {
        params.search = search;
      }

      const result = await getAdminOrdersAction(auth.accessToken!, params);
      if (result.success && result.data) {
        setOrderList(result.data.data);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
      setLoading(false);
    })();
  }, [auth?.accessToken, page, status, search]);

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-xl text-(--text-primary)">Orders</h1>
        <p className="body-sm text-(--text-muted) mt-1">
          All orders across all events and organizers
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-(--text-muted)" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSearch(searchInput);
              setPage(1);
            }
          }}
          placeholder="Search by order number or email…"
          className="input-base pl-10"
        />
      </div>

      <div className="flex gap-1 mb-6 border-b border-(--border)">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={cn(
              'px-4 py-2.5 body-sm font-medium border-b-2 transition-colors -mb-px',
              status === tab.value
                ? 'border-(--primary) text-(--primary)'
                : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : orderList.length === 0 ? (
        <div className="card border-dashed p-12 text-center">
          <p className="text-(--text-muted) body-sm">No orders found.</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-(--surface-raised) border-b border-(--border)">
                <tr>
                  {['Order', 'Customer', 'Event', 'Amount', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left caption text-(--text-muted)">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {orderList.map((order) => (
                  <tr key={order.id} className="hover:bg-(--surface-raised)">
                    <td className="px-4 py-3 font-mono caption text-(--text-secondary)">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="body-sm text-(--text-primary) font-medium">
                        {order.customerName}
                      </p>
                      <p className="caption text-(--text-muted)">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 body-sm text-(--text-secondary) max-w-[160px] truncate">
                      {order.eventTitle ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-(--text-primary)">
                      {order.isFreeOrder ? 'FREE' : formatNaira(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status as OrderStatus} />
                    </td>
                    <td className="px-4 py-3 body-sm text-(--text-muted) whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="body-sm font-semibold text-(--primary) hover:text-(--primary-hover)"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between body-sm text-(--text-muted)">
              <span>
                Showing {orderList.length} of {total}
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
