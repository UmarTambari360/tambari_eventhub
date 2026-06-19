'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Star, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getAdminEventsAction,
  featureEventAction,
  cancelAdminEventAction,
  type AdminEventRow,
} from '@/actions/admin/events.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate, cn } from '@/lib/utils';

type StatusFilter = 'all' | 'published' | 'unpublished' | 'cancelled';

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
      setError(result.error ?? 'Failed');
    }
    setActionLoading(null);
  }

  async function handleCancel(event: AdminEventRow) {
    if (!auth?.accessToken) return;
    if (!confirm(`Cancel "${event.title}"? This cannot be undone.`)) return;
    setActionLoading(event.id);
    const result = await cancelAdminEventAction(event.id, auth.accessToken);
    if (result.success) {
      setEvts((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, isCancelled: true, isPublished: false } : e))
      );
    } else {
      setError(result.error ?? 'Failed');
    }
    setActionLoading(null);
  }

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: 'Published', value: 'published' },
    { label: 'Unpublished', value: 'unpublished' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-xl text-(--text-primary)">Events</h1>
        <p className="body-sm text-(--text-muted) mt-1">All events across all organizers</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
          placeholder="Search by event title…"
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
      ) : evts.length === 0 ? (
        <div className="card border-dashed p-12 text-center">
          <p className="text-(--text-muted) body-sm">No events found.</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-(--surface-raised) border-b border-(--border)">
                <tr>
                  {['Event', 'Organizer', 'Date', 'Status', 'Featured', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left caption text-(--text-muted)">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {evts.map((event) => (
                  <tr key={event.id} className="hover:bg-(--surface-raised)">
                    <td className="px-4 py-3">
                      <Link
                        href={`/events/${event.slug}`}
                        target="_blank"
                        className="font-medium text-(--text-primary) hover:text-(--primary) line-clamp-1"
                      >
                        {event.title}
                      </Link>
                      <p className="caption text-(--text-muted)">
                        {event.isFree ? 'Free' : 'Paid'}
                        {event.category && ` · ${event.category}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 body-sm text-(--text-secondary)">
                      {event.organizerBusiness ?? event.organizerName ?? '—'}
                    </td>
                    <td className="px-4 py-3 body-sm text-(--text-muted) whitespace-nowrap">
                      {formatDate(event.eventDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'badge',
                          event.isCancelled
                            ? 'badge-danger'
                            : event.isPublished
                              ? 'badge-success'
                              : 'badge-neutral'
                        )}
                      >
                        {event.isCancelled
                          ? 'Cancelled'
                          : event.isPublished
                            ? 'Published'
                            : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {event.isFeatured && (
                        <span className="flex items-center gap-1 caption text-amber-600 font-semibold">
                          <Star className="h-3.5 w-3.5 fill-current" /> #{event.featureOrder ?? '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!event.isCancelled && (
                          <button
                            onClick={() => void handleFeatureToggle(event)}
                            disabled={actionLoading === event.id}
                            title={event.isFeatured ? 'Remove from featured' : 'Feature event'}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              event.isFeatured
                                ? 'text-amber-500 hover:bg-amber-50'
                                : 'text-(--text-muted) hover:text-amber-500 hover:bg-amber-50'
                            )}
                          >
                            {actionLoading === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Star className={cn('h-4 w-4', event.isFeatured && 'fill-current')} />
                            )}
                          </button>
                        )}
                        {!event.isCancelled && (
                          <button
                            onClick={() => void handleCancel(event)}
                            disabled={actionLoading === event.id}
                            title="Cancel event"
                            className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between body-sm text-(--text-muted)">
              <span>
                Showing {evts.length} of {total}
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
