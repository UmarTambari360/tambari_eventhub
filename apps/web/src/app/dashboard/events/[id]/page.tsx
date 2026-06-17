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
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  updateEventSchema,
  type UpdateEventInput,
  updateTicketTypeSchema,
  type UpdateTicketTypeInput,
} from '@eventhub/validators';
import { useAuth } from '@/hooks/use-auth';
import {
  getOrganizerEventDetailAction,
  updateEventAction,
  publishEventAction,
  cancelEventAction,
} from '@/actions/event.actions';
import { getEventAttendeesAction, getEventTicketStatsAction } from '@/actions/analytics.actions';
import { AttendeesTable } from '@/components/organizer/attendees-table';
import { StatsCard } from '@/components/organizer/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate, formatNaira, cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { OrganizerEventDTO } from '@eventhub/types';
import type { EventAttendee, TicketTypeStat } from '@/actions/analytics.actions';

const CATEGORIES = [
  'Music',
  'Business',
  'Arts',
  'Food',
  'Sports',
  'Tech',
  'Fashion',
  'Culture',
  'Comedy',
  'Religion',
] as const;

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
        eventDate: e.eventDate ? new Date(e.eventDate).toISOString().slice(0, 16) : '',
        eventEndDate: e.eventEndDate ? new Date(e.eventEndDate).toISOString().slice(0, 16) : '',
        category: (e.category as (typeof CATEGORIES)[number] | undefined) ?? undefined,
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
        <p className="body-sm text-(--text-muted) mb-3">Event not found.</p>
        <button onClick={() => router.back()} className="btn btn-ghost btn-md">
          ← Back
        </button>
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
      <button
        onClick={() => router.push('/dashboard/events')}
        className="flex items-center gap-1.5 body-sm text-(--text-muted) hover:text-(--text-primary) mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </button>

      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-(--text-primary) leading-tight">{event.title}</h1>
          <p className="body-sm text-(--text-muted) mt-0.5">{formatDate(event.eventDate)}</p>
        </div>
        <StatusBadge
          status={event.isCancelled ? 'cancelled' : event.isPublished ? 'active' : 'inactive'}
        />
      </div>

      {/* Feedback banners */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 body-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 body-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Action buttons */}
      {!event.isCancelled && (
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => void handleTogglePublish()}
            disabled={actionLoading === 'publish'}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-4 py-2 body-sm font-medium transition-colors',
              event.isPublished
                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                : 'border-green-200 text-green-700 hover:bg-green-50'
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
          </button>

          <button
            onClick={() => void handleCancel()}
            disabled={actionLoading === 'cancel'}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 body-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            {actionLoading === 'cancel' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Cancel Event
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-(--border)">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 body-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-(--primary) text-(--primary)'
                : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {activeTab === 'details' && !event.isCancelled && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <section className="card p-5 space-y-5">
            <h2 className="heading-sm text-(--text-primary)">Event Details</h2>

            <div>
              <label className="label-text">Event Title</label>
              <input {...register('title')} className={inputCls(!!errors.title)} />
              {errors.title && <p className="field-error">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label-text">Description</label>
              <textarea
                {...register('description')}
                rows={5}
                className={inputCls(!!errors.description) + ' resize-none'}
              />
              {errors.description && <p className="field-error">{errors.description.message}</p>}
            </div>

            <div>
              <label className="label-text">Category</label>
              <select {...register('category')} className={inputCls(false) + ' bg-(--surface)'}>
                <option value="">No category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="card p-5 space-y-5">
            <h2 className="heading-sm text-(--text-primary)">Location & Date</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label-text">Venue</label>
                <input {...register('venue')} className={inputCls(!!errors.venue)} />
                {errors.venue && <p className="field-error">{errors.venue.message}</p>}
              </div>
              <div>
                <label className="label-text">City</label>
                <input {...register('location')} className={inputCls(!!errors.location)} />
                {errors.location && <p className="field-error">{errors.location.message}</p>}
              </div>
            </div>

            <div>
              <label className="label-text">Full Address</label>
              <input {...register('address')} className={inputCls(false)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label-text">Start Date & Time</label>
                <input
                  {...register('eventDate')}
                  type="datetime-local"
                  className={inputCls(!!errors.eventDate)}
                />
              </div>
              <div>
                <label className="label-text">End Date & Time</label>
                <input
                  {...register('eventEndDate')}
                  type="datetime-local"
                  className={inputCls(false)}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/events')}
              className="btn btn-ghost btn-md"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="flex items-center gap-2 btn btn-primary btn-md disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      )}

      {event.isCancelled && activeTab === 'details' && (
        <div className="card p-8 text-center">
          <p className="body-sm text-(--text-muted)">
            This event has been cancelled and cannot be edited.
          </p>
        </div>
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
          {/* Search */}
          <div className="relative">
            <input
              value={attendeesSearch}
              onChange={(e) => {
                setAttendeesSearch(e.target.value);
                setAttendeesPage(1);
              }}
              placeholder="Search by name, email, or ticket code..."
              className="input-base pl-4"
            />
          </div>

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
            <div className="flex items-center justify-between body-sm text-(--text-muted)">
              <span>{attendeesTotal} total attendees</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setAttendeesPage((p) => Math.max(1, p - 1))}
                  disabled={attendeesPage === 1}
                  className="btn btn-ghost btn-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 py-1">
                  {attendeesPage} / {attendeesTotalPages}
                </span>
                <button
                  onClick={() => setAttendeesPage((p) => Math.min(attendeesTotalPages, p + 1))}
                  disabled={attendeesPage === attendeesTotalPages}
                  className="btn btn-ghost btn-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <StatsCard key={i} label="" value="" loading />
              ))}
            </div>
          ) : ticketStats.length === 0 ? (
            <div className="card border-dashed p-12 text-center">
              <p className="body-sm text-(--text-muted)">No ticket sales yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatsCard
                  label="Total Sold"
                  value={ticketStats.reduce((s, t) => s + t.quantitySold, 0)}
                  subValue={`of ${ticketStats.reduce((s, t) => s + t.quantity, 0)} capacity`}
                />
                <StatsCard
                  label="Gross Revenue"
                  value={formatNaira(ticketStats.reduce((s, t) => s + t.revenue, 0))}
                />
                <StatsCard label="Ticket Types" value={ticketStats.length} />
                <StatsCard
                  label="Sell-Through"
                  value={`${Math.round(
                    (ticketStats.reduce((s, t) => s + t.quantitySold, 0) /
                      Math.max(
                        ticketStats.reduce((s, t) => s + t.quantity, 0),
                        1
                      )) *
                      100
                  )}%`}
                />
              </div>

              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-(--surface-raised) border-b border-(--border)">
                    <tr>
                      <th className="px-4 py-3 text-left caption text-(--text-muted)">
                        Ticket Type
                      </th>
                      <th className="px-4 py-3 text-right caption text-(--text-muted)">Price</th>
                      <th className="px-4 py-3 text-right caption text-(--text-muted)">Sold</th>
                      <th className="px-4 py-3 text-right caption text-(--text-muted)">
                        Available
                      </th>
                      <th className="px-4 py-3 text-right caption text-(--text-muted)">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)">
                    {ticketStats.map((tt) => (
                      <tr
                        key={tt.ticketTypeId}
                        className="hover:bg-(--surface-raised) transition-colors"
                      >
                        <td className="px-4 py-3 heading-sm text-(--text-primary)">{tt.name}</td>
                        <td className="px-4 py-3 text-right body-sm text-(--text-secondary)">
                          {tt.price === 0 ? 'FREE' : formatNaira(tt.price)}
                        </td>
                        <td className="px-4 py-3 text-right body-sm font-semibold text-(--text-primary)">
                          {tt.quantitySold}
                        </td>
                        <td className="px-4 py-3 text-right body-sm text-(--text-secondary)">
                          {tt.quantity - tt.quantitySold}
                        </td>
                        <td className="px-4 py-3 text-right body-sm font-semibold text-(--primary)">
                          {tt.price === 0 ? '—' : formatNaira(tt.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Ticket Types Editor ───────────────────────────────────────────────────────

interface TicketTypesEditorProps {
  event: OrganizerEventDTO;
  accessToken: string;
  onRefresh: () => void;
  setError: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
}

function TicketTypesEditor({
  event,
  accessToken,
  onRefresh,
  setError,
  setSuccessMsg,
}: TicketTypesEditorProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const ticketTypes = event.ticketTypes ?? [];

  async function handleUpdate(ticketTypeId: string, data: UpdateTicketTypeInput) {
    setSaving(ticketTypeId);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiClient.patch(`/events/ticket-types/${ticketTypeId}`, data);
      setSuccessMsg('Ticket type updated.');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket type');
    }
    setSaving(null);
  }

  async function handleDelete(ticketTypeId: string) {
    if (!confirm('Delete this ticket type? This cannot be undone.')) return;
    setDeleting(ticketTypeId);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiClient.delete(`/events/ticket-types/${ticketTypeId}`);
      setSuccessMsg('Ticket type deleted.');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ticket type');
    }
    setDeleting(null);
  }

  if (event.isCancelled) {
    return (
      <div className="card p-8 text-center">
        <p className="body-sm text-(--text-muted)">
          Ticket types cannot be edited for cancelled events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ticketTypes.length === 0 && (
        <div className="card border-dashed p-8 text-center">
          <p className="body-sm text-(--text-muted)">No ticket types yet. Create your first one.</p>
        </div>
      )}

      {ticketTypes.map((tt) => (
        <TicketTypeRow
          key={tt.id}
          ticketType={tt}
          isExpanded={expanded === tt.id}
          onToggle={() => setExpanded(expanded === tt.id ? null : tt.id)}
          onSave={(data) => void handleUpdate(tt.id, data)}
          onDelete={() => void handleDelete(tt.id)}
          isSaving={saving === tt.id}
          isDeleting={deleting === tt.id}
        />
      ))}

      {ticketTypes.length < 10 && (
        <AddTicketTypeRow
          eventId={event.id}
          accessToken={accessToken}
          onAdded={() => {
            setSuccessMsg('Ticket type added.');
            onRefresh();
          }}
          setError={setError}
        />
      )}
    </div>
  );
}

// ─── Single ticket type row (edit in-place) ───────────────────────────────────

interface TicketTypeRowProps {
  ticketType: OrganizerEventDTO['ticketTypes'][number];
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (data: UpdateTicketTypeInput) => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

function TicketTypeRow({
  ticketType: tt,
  isExpanded,
  onToggle,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: TicketTypeRowProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateTicketTypeInput>({
    resolver: zodResolver(updateTicketTypeSchema),
    defaultValues: {
      name: tt.name,
      description: tt.description ?? '',
      price: tt.price,
      quantity: tt.quantity,
      minPurchase: tt.minPurchase,
      maxPurchase: tt.maxPurchase,
      isActive: tt.isActive,
    },
  });

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 bg-(--surface-raised) hover:bg-(--surface-overlay) transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="heading-sm text-(--text-primary) truncate">{tt.name}</span>
          <span className="badge badge-neutral shrink-0">
            {tt.price === 0 ? 'FREE' : formatNaira(tt.price)}
          </span>
          <span className="caption text-(--text-muted) shrink-0">
            {tt.quantitySold}/{tt.quantity} sold
          </span>
          {!tt.isActive && <span className="badge badge-danger shrink-0">Inactive</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting || tt.quantitySold > 0}
            className="p-1.5 rounded text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
            title={tt.quantitySold > 0 ? 'Cannot delete — tickets sold' : 'Delete ticket type'}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-(--text-muted)" />
          ) : (
            <ChevronDown className="h-4 w-4 text-(--text-muted)" />
          )}
        </div>
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit(onSave)} className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Name</label>
              <input {...register('name')} className={inputCls(!!errors.name)} />
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label-text">Price (kobo) — 0 for free</label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                min={0}
                step={100}
                className={inputCls(!!errors.price)}
              />
              {errors.price && <p className="field-error">{errors.price.message}</p>}
            </div>
          </div>

          <div>
            <label className="label-text">Description</label>
            <input {...register('description')} className={inputCls(false)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-text">Quantity</label>
              <input
                {...register('quantity', { valueAsNumber: true })}
                type="number"
                min={tt.quantitySold}
                className={inputCls(!!errors.quantity)}
              />
              {errors.quantity && <p className="field-error">{errors.quantity.message}</p>}
              {tt.quantitySold > 0 && (
                <p className="caption text-(--text-muted) mt-0.5">Min: {tt.quantitySold} (sold)</p>
              )}
            </div>
            <div>
              <label className="label-text">Min per order</label>
              <input
                {...register('minPurchase', { valueAsNumber: true })}
                type="number"
                min={1}
                className={inputCls(false)}
              />
            </div>
            <div>
              <label className="label-text">Max per order</label>
              <input
                {...register('maxPurchase', { valueAsNumber: true })}
                type="number"
                min={1}
                max={20}
                className={inputCls(false)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`active-${tt.id}`}
              {...register('isActive')}
              className="h-4 w-4 rounded"
            />
            <label htmlFor={`active-${tt.id}`} className="body-sm text-(--text-secondary)">
              Active (visible to buyers)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="flex items-center gap-2 btn btn-primary btn-sm disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Add ticket type inline row ───────────────────────────────────────────────

interface AddTicketTypeRowProps {
  eventId: string;
  accessToken: string;
  onAdded: () => void;
  setError: (msg: string | null) => void;
}

function AddTicketTypeRow({ eventId, onAdded, setError }: AddTicketTypeRowProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      price: 0,
      quantity: 100,
      minPurchase: 1,
      maxPurchase: 10,
      description: '',
    },
  });

  async function onSubmit(data: {
    name: string;
    price: number;
    quantity: number;
    minPurchase: number;
    maxPurchase: number;
    description: string;
  }) {
    setSaving(true);
    setError(null);
    try {
      await apiClient.post(`/events/${eventId}/ticket-types`, data);
      reset();
      setOpen(false);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ticket type');
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-(--border) py-4 body-sm text-(--text-muted) hover:border-(--primary) hover:text-(--primary) transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Ticket Type
      </button>
    );
  }

  return (
    <div className="card p-5 border-2 border-(--primary)/30">
      <h3 className="heading-sm text-(--text-primary) mb-4">New Ticket Type</h3>
      <form onSubmit={handleSubmit((d) => void onSubmit(d))} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Name *</label>
            <input
              {...register('name', { required: true })}
              className={inputCls(!!errors.name)}
              placeholder="e.g. General Admission"
            />
          </div>
          <div>
            <label className="label-text">Price in kobo (0 = free) *</label>
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              min={0}
              step={100}
              className={inputCls(false)}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="label-text">Description</label>
          <input
            {...register('description')}
            className={inputCls(false)}
            placeholder="What's included?"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label-text">Quantity *</label>
            <input
              {...register('quantity', { valueAsNumber: true })}
              type="number"
              min={1}
              className={inputCls(false)}
            />
          </div>
          <div>
            <label className="label-text">Min per order</label>
            <input
              {...register('minPurchase', { valueAsNumber: true })}
              type="number"
              min={1}
              className={inputCls(false)}
            />
          </div>
          <div>
            <label className="label-text">Max per order</label>
            <input
              {...register('maxPurchase', { valueAsNumber: true })}
              type="number"
              min={1}
              max={20}
              className={inputCls(false)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 btn btn-primary btn-sm"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </form>
    </div>
  );
}

function inputCls(hasError: boolean): string {
  return cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors bg-(--surface)',
    hasError ? 'border-red-300 bg-red-50' : 'border-(--border)'
  );
}
