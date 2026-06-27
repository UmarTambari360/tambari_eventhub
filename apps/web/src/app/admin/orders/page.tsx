'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getAdminOrdersAction, type AdminOrderRow } from '@/actions/admin/orders.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminOrdersTable } from '@/components/admin/orders-table';

type StatusFilter = 'all' | 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'All Orders', value: 'all' },
];

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

  const handleTabChange = (value: StatusFilter) => {
    setStatus(value);
    setPage(1);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="heading-xl text-text-primary">Orders</h1>
        <p className="text-text-secondary text-sm">All orders across all events and organizers</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            placeholder="Search by order number or email…"
            className="pl-9 border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500"
          />
        </div>
        <Button onClick={handleSearch} className="btn-primary">
          Search
        </Button>
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
                status === tab.value
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
      ) : orderList.length === 0 ? (
        <Card className="border-dashed border-border bg-surface-overlay">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-text-secondary text-sm">No orders found.</p>
            {search && (
              <Button
                variant="link"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setPage(1);
                }}
                className="text-primary-600 mt-2"
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <AdminOrdersTable orders={orderList} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-sm text-text-muted">
              <span>
                Showing {orderList.length} of {total}
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
