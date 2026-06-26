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
import { formatDate } from '@/lib/utils';
import type { OrganizerEventDTO } from '@eventhub/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
          <h1 className="display-md text-text-primary">My Events</h1>
          <p className="body-sm text-text-muted mt-0.5">Create and manage your events</p>
        </div>
        <Button asChild className="btn-primary">
          <Link href="/dashboard/events/create">
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 border-danger/20 bg-danger-light">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <Card className="border-dashed border-2 border-border py-16 text-center">
          <CardContent className="pt-6">
            <p className="text-4xl mb-3">🎪</p>
            <p className="heading-sm text-text-primary mb-1">No events yet</p>
            <p className="body-sm text-text-muted mt-1 mb-6">
              Create your first event to get started
            </p>
            <Button asChild className="btn-primary">
              <Link href="/dashboard/events/create">
                <Plus className="h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-surface-raised">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-text-muted font-medium">Event</TableHead>
                  <TableHead className="text-text-muted font-medium hidden sm:table-cell">
                    Date
                  </TableHead>
                  <TableHead className="text-text-muted font-medium hidden md:table-cell">
                    Location
                  </TableHead>
                  <TableHead className="text-text-muted font-medium">Status</TableHead>
                  <TableHead className="text-text-muted font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="border-border hover:bg-surface-raised/50 transition-colors"
                  >
                    <TableCell>
                      <div className="font-medium text-text-primary line-clamp-1">
                        {event.title}
                      </div>
                      <div className="caption text-text-muted mt-0.5">
                        {event.isFree ? 'Free' : 'Paid'}
                        {event.category && ` · ${event.category}`}
                      </div>
                    </TableCell>
                    <TableCell className="text-text-secondary hidden sm:table-cell whitespace-nowrap">
                      {formatDate(event.eventDate)}
                    </TableCell>
                    <TableCell className="text-text-secondary hidden md:table-cell">
                      {event.location}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getEventStatus(event)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-text-muted hover:text-primary-600 hover:bg-primary-50"
                        >
                          <Link href={`/dashboard/events/${event.id}`} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>

                        {!event.isCancelled && (
                          <Button
                            onClick={() => void handleTogglePublish(event)}
                            disabled={actionLoading === event.id}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-muted hover:text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                            title={event.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {actionLoading === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : event.isPublished ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        {!event.isCancelled && (
                          <Button
                            onClick={() => void handleCancel(event.id)}
                            disabled={actionLoading === event.id}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-text-muted hover:text-danger hover:bg-danger-light disabled:opacity-50"
                            title="Cancel event"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
