'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getAdminEventsAction,
  featureEventAction,
  cancelAdminEventAction,
  type AdminEventRow,
} from '@/actions/admin/events.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { EventsTable } from '@/components/admin/events-table';

type StatusFilter = 'all' | 'published' | 'unpublished' | 'cancelled';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'Published', value: 'published' },
  { label: 'Unpublished', value: 'unpublished' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'All Events', value: 'all' },
];

export default function AdminEventsPage() {
  const auth = useAuth();
  const [evts, setEvts] = useState<AdminEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('published');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) return;
    setLoading(true);
    void (async () => {
      const result = await getAdminEventsAction(auth.accessToken!, {
        page,
        ...(status !== 'all' ? { status } : {}),
        ...(search ? { search } : {}),
      });
      if (result.success && result.data) {
        setEvts(result.data.data);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
      setLoading(false);
    })();
  }, [auth?.accessToken, page, status, search]);

  async function handleFeatureToggle(event: AdminEventRow) {
    if (!auth?.accessToken) return;
    setActionLoading(event.id);
    setError(null);
    const newFeatured = !event.isFeatured;
    const newOrder = newFeatured ? 99 : null;
    const result = await featureEventAction(event.id, newFeatured, newOrder, auth.accessToken);
    if (result.success) {
      setEvts((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, isFeatured: newFeatured, featureOrder: newOrder } : e
        )
      );
    } else {
      setError(result.error ?? 'Failed to update feature status');
    }
    setActionLoading(null);
  }

  async function handleCancel(event: AdminEventRow) {
    if (!auth?.accessToken) return;
    if (!confirm(`Cancel "${event.title}"? This cannot be undone.`)) return;
    setActionLoading(event.id);
    setError(null);
    const result = await cancelAdminEventAction(event.id, auth.accessToken);
    if (result.success) {
      setEvts((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, isCancelled: true, isPublished: false } : e))
      );
    } else {
      setError(result.error ?? 'Failed to cancel event');
    }
    setActionLoading(null);
  }

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
        <h1 className="heading-xl text-text-primary">Events</h1>
        <p className="text-text-secondary text-sm">All events across all organizers</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
            placeholder="Search by event title…"
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
      ) : evts.length === 0 ? (
        <Card className="border-dashed border-border bg-surface-overlay">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-text-secondary text-sm">No events found.</p>
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
          <EventsTable
            events={evts}
            actionLoading={actionLoading}
            onFeatureToggle={handleFeatureToggle}
            onCancel={handleCancel}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-sm text-text-muted">
              <span>
                Showing {evts.length} of {total}
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
