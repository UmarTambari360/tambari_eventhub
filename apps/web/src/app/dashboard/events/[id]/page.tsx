'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  Loader2,
  Eye,
  EyeOff,
  XCircle,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { updateEventSchema, type UpdateEventInput } from '@eventhub/validators';
import { useAuth } from '@/hooks/use-auth';
import {
  getOrganizerEventDetailAction,
  updateEventAction,
  publishEventAction,
  cancelEventAction,
} from '@/actions/event.actions';
import { getEventAttendeesAction, getEventTicketStatsAction } from '@/actions/analytics.actions';
import { AttendeesTable } from '@/components/organizer/attendees-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate, cn, toDatetimeLocalValue } from '@/lib/utils';
import type { OrganizerEventDTO } from '@eventhub/types';
import type { EventAttendee, TicketTypeStat } from '@/actions/analytics.actions';
import { EventDetailsForm } from '@/components/organizer/event-details-form';
import { TicketTypesEditor } from '@/components/organizer/ticket-types-editor';
import { EventStats } from '@/components/organizer/event-stats';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

type Tab = 'details' | 'tickets' | 'attendees' | 'stats';

export default function EditEventPage() {
  const auth = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<OrganizerEventDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('details');

  // Attendees tab state
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [attendeesTotal, setAttendeesTotal] = useState(0);
  const [attendeesPage, setAttendeesPage] = useState(1);
  const [attendeesTotalPages, setAttendeesTotalPages] = useState(1);
  const [attendeesSearch, setAttendeesSearch] = useState('');
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  // Stats tab state
  const [ticketStats, setTicketStats] = useState<TicketTypeStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateEventInput>({
    resolver: zodResolver(updateEventSchema),
  });

  const loadEvent = useCallback(async () => {
    if (!auth?.accessToken || !id) return;
    const result = await getOrganizerEventDetailAction(id, auth.accessToken);
    if (result.success && result.data) {
      const e = result.data as OrganizerEventDTO & { description?: string };
      setEvent(result.data);
      reset({
        title: e.title,
        description: e.description ?? '',
        venue: e.venue,
        location: e.location,
        eventDate: e.eventDate ? toDatetimeLocalValue(e.eventDate) : '',
        eventEndDate: e.eventEndDate ? toDatetimeLocalValue(e.eventEndDate) : '',
        category: (e.category as any) ?? undefined,
        tags: e.tags,
      });
    }
    setLoading(false);
  }, [auth?.accessToken, id, reset]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const loadAttendees = useCallback(async () => {
    if (!auth?.accessToken || !id) return;
    setAttendeesLoading(true);
    const result = await getEventAttendeesAction(
      id,
      auth.accessToken,
      attendeesPage,
      attendeesSearch || undefined
    );
    if (result.success && result.data) {
      setAttendees(result.data.items);
      setAttendeesTotal(result.data.total);
      setAttendeesTotalPages(result.data.totalPages);
    }
    setAttendeesLoading(false);
  }, [auth?.accessToken, id, attendeesPage, attendeesSearch]);

  const loadStats = useCallback(async () => {
    if (!auth?.accessToken || !id) return;
    setStatsLoading(true);
    const result = await getEventTicketStatsAction(id, auth.accessToken);
    if (result.success && result.data) {
      setTicketStats(result.data.ticketStats);
    }
    setStatsLoading(false);
  }, [auth?.accessToken, id]);

  useEffect(() => {
    if (activeTab === 'attendees') void loadAttendees();
    if (activeTab === 'stats') void loadStats();
  }, [activeTab, loadAttendees, loadStats]);

  useEffect(() => {
    if (activeTab === 'attendees') void loadAttendees();
  }, [attendeesPage, attendeesSearch, activeTab, loadAttendees]);

  async function onSubmit(data: UpdateEventInput) {
    if (!auth?.accessToken || !id) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    const result = await updateEventAction(id, data, auth.accessToken);
    if (result.success) {
      setSuccessMsg('Event updated successfully.');
      await loadEvent();
    } else {
      setError(result.error ?? 'Failed to update event');
    }
    setSaving(false);
  }

  async function handleTogglePublish() {
    if (!auth?.accessToken || !event || !id) return;
    setActionLoading('publish');
    setError(null);
    setSuccessMsg(null);
    const result = await publishEventAction(id, !event.isPublished, auth.accessToken);
    if (result.success) {
      const next = !event.isPublished;
      setEvent((prev) => (prev ? { ...prev, isPublished: next } : prev));
      setSuccessMsg(next ? 'Event published.' : 'Event unpublished.');
    } else {
      setError(result.error ?? 'Failed to update publish status');
    }
    setActionLoading(null);
  }

  async function handleCancel() {
    if (!auth?.accessToken || !id) return;
    if (!confirm('Cancel this event? This cannot be undone.')) return;
    setActionLoading('cancel');
    const result = await cancelEventAction(id, auth.accessToken);
    if (result.success) {
      setEvent((prev) => (prev ? { ...prev, isCancelled: true, isPublished: false } : prev));
      setSuccessMsg('Event cancelled.');
    } else {
      setError(result.error ?? 'Failed to cancel event');
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="body-sm text-text-muted mb-3">Event not found.</p>
        <Button onClick={() => router.back()} variant="outline">
          ← Back
        </Button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'tickets', label: 'Ticket Types' },
    { key: 'attendees', label: `Attendees${attendeesTotal > 0 ? ` (${attendeesTotal})` : ''}` },
    { key: 'stats', label: 'Stats' },
  ];

  return (
    <div className="max-w-3xl">
      {/* Back + header */}
      <Button
        onClick={() => router.push('/dashboard/events')}
        variant="ghost"
        className="flex items-center gap-1.5 body-sm text-text-muted hover:text-text-primary mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Button>

      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h1 className="display-md text-text-primary leading-tight">{event.title}</h1>
          <p className="body-sm text-text-muted mt-0.5">{formatDate(event.eventDate)}</p>
        </div>
        <StatusBadge
          status={event.isCancelled ? 'cancelled' : event.isPublished ? 'active' : 'inactive'}
        />
      </div>

      {/* Feedback banners */}
      {successMsg && (
        <Alert className="mb-4 border-success/20 bg-success-light text-success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4 border-danger/20 bg-danger-light">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      {!event.isCancelled && (
        <div className="flex items-center gap-2 mb-5">
          <Button
            onClick={() => void handleTogglePublish()}
            disabled={actionLoading === 'publish'}
            variant="outline"
            className={cn(
              'border',
              event.isPublished
                ? 'border-warning/30 text-warning hover:bg-warning-light'
                : 'border-success/30 text-success hover:bg-success-light'
            )}
          >
            {actionLoading === 'publish' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : event.isPublished ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {event.isPublished ? 'Unpublish' : 'Publish'}
          </Button>

          <Button
            onClick={() => void handleCancel()}
            disabled={actionLoading === 'cancel'}
            variant="outline"
            className="border-danger/30 text-danger hover:bg-danger-light"
          >
            {actionLoading === 'cancel' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Cancel Event
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 body-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-brand text-brand'
                : 'border-transparent text-text-muted hover:text-text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {activeTab === 'details' && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <EventDetailsForm register={register} errors={errors} isCancelled={!!event.isCancelled} />

          {!event.isCancelled && (
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={() => router.push('/dashboard/events')}
                variant="outline"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={saving || !isDirty}
                className="btn-primary disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          )}
        </form>
      )}

      {/* Tickets tab */}
      {activeTab === 'tickets' && (
        <TicketTypesEditor
          event={event}
          accessToken={auth?.accessToken ?? ''}
          onRefresh={loadEvent}
          setError={setError}
          setSuccessMsg={setSuccessMsg}
        />
      )}

      {/* Attendees tab */}
      {activeTab === 'attendees' && (
        <div className="space-y-4">
          <Input
            value={attendeesSearch}
            onChange={(e) => {
              setAttendeesSearch(e.target.value);
              setAttendeesPage(1);
            }}
            placeholder="Search by name, email, or ticket code..."
            className="input-base"
          />

          {attendeesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <AttendeesTable
              attendees={attendees}
              eventId={id}
              accessToken={auth?.accessToken ?? ''}
              onRefresh={() => void loadAttendees()}
            />
          )}

          {attendeesTotalPages > 1 && (
            <div className="flex items-center justify-between body-sm text-text-muted">
              <span>{attendeesTotal} total attendees</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setAttendeesPage((p) => Math.max(1, p - 1))}
                  disabled={attendeesPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="px-2 py-1">
                  {attendeesPage} / {attendeesTotalPages}
                </span>
                <Button
                  onClick={() => setAttendeesPage((p) => Math.min(attendeesTotalPages, p + 1))}
                  disabled={attendeesPage === attendeesTotalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats tab */}
      {activeTab === 'stats' && <EventStats ticketStats={ticketStats} loading={statsLoading} />}
    </div>
  );
}
