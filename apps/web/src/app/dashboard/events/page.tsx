'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Eye, EyeOff, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getOrganizerEventsAction,
  publishEventAction,
  cancelEventAction,
} from '@/actions/event.actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate, formatNaira } from '@/lib/utils';
import type { OrganizerEventDTO } from '@eventhub/types';

export default function DashboardEventsPage() {
  const auth = useAuth();
  const accessToken = auth?.accessToken;

  const [events, setEvents] = useState<OrganizerEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      const result = await getOrganizerEventsAction(accessToken);
      if (result.success && result.data) {
        setEvents(result.data.items as OrganizerEventDTO[]);
      }
      setLoading(false);
    })();
  }, [accessToken]);

  async function handleTogglePublish(event: OrganizerEventDTO) {
    if (!accessToken) return;
    setActionLoading(event.id);
    setError(null);

    const result = await publishEventAction(event.id, !event.isPublished, accessToken);

    if (result.success) {
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, isPublished: !e.isPublished } : e))
      );
    } else {
      setError(result.error ?? 'Action failed');
    }
    setActionLoading(null);
  }

  async function handleCancel(eventId: string) {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to cancel this event? This cannot be undone.')) return;

    setActionLoading(eventId);
    setError(null);

    const result = await cancelEventAction(eventId, accessToken);

    if (result.success) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, isCancelled: true, isPublished: false } : e))
      );
    } else {
      setError(result.error ?? 'Failed to cancel event');
    }
    setActionLoading(null);
  }

  function getEventStatus(event: OrganizerEventDTO): 'active' | 'inactive' | 'cancelled' {
    if (event.isCancelled) return 'cancelled';
    if (event.isPublished) return 'active';
    return 'inactive';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-500 text-sm mt-0.5">Create and manage your events</p>
        </div>
        <Link
          href="/dashboard/events/create"
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <p className="text-2xl mb-2">🎪</p>
          <p className="text-gray-500 font-medium">No events yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Create your first event to get started</p>
          <Link
            href="/dashboard/events/create"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Event</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">
                  Date
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500 hidden md:table-cell">
                  Location
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900 line-clamp-1">{event.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {event.isFree ? 'Free' : 'Paid'}
                      {event.category && ` · ${event.category}`}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 hidden sm:table-cell whitespace-nowrap">
                    {formatDate(event.eventDate)}
                  </td>
                  <td className="px-5 py-4 text-gray-600 hidden md:table-cell">{event.location}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={getEventStatus(event)} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>

                      {!event.isCancelled && (
                        <button
                          onClick={() => void handleTogglePublish(event)}
                          disabled={actionLoading === event.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50"
                          title={event.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {actionLoading === event.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : event.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      {!event.isCancelled && (
                        <button
                          onClick={() => void handleCancel(event.id)}
                          disabled={actionLoading === event.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Cancel event"
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
      )}
    </div>
  );
}
