// app/dashboard/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getOrganizerOrdersAction } from '@/actions/analytics.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { OrganizerOrder } from '@/actions/analytics.actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrdersTable } from '@/components/organizer/orders-table';

type StatusFilter = 'all' | 'paid' | 'refunded' | 'cancelled';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All Orders', value: 'all' },
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

  const handleTabChange = (tabValue: StatusFilter) => {
    router.push(`/dashboard/orders?status=${tabValue}`);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="heading-xl text-text-primary">Orders</h1>
        <p className="text-text-secondary text-sm">All ticket orders across your events</p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant="ghost"
            size="sm"
            onClick={() => handleTabChange(tab.value)}
            className={`
              rounded-none border-b-2 px-4 py-2.5 h-auto text-sm font-medium
              transition-colors -mb-px
              ${
                statusParam === tab.value
                  ? 'border-primary-600 text-text-primary hover:text-text-primary hover:bg-transparent'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:bg-transparent'
              }
            `}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed border-border bg-surface-overlay">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-text-secondary text-sm">No orders found.</p>
            {statusParam !== 'all' && (
              <Button
                variant="link"
                onClick={() => handleTabChange('all')}
                className="text-primary-600 mt-2"
              >
                View all orders
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Orders Table */}
          <OrdersTable orders={orders} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-sm text-text-muted">
              <span>
                Showing {orders.length} of {total} orders
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-border text-text-secondary hover:bg-surface-raised"
                >
                  Previous
                </Button>
                <Badge variant="outline" className="px-3 py-1.5 text-text-primary border-border">
                  {page} / {totalPages}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-border text-text-secondary hover:bg-surface-raised"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
