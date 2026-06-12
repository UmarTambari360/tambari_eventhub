'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { updateEventSchema, type UpdateEventInput } from '@eventhub/validators';
import { useAuth } from '@/hooks/use-auth';
import {
  getOrganizerEventDetailAction,
  updateEventAction,
  publishEventAction,
  cancelEventAction,
} from '@/actions/event.actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate, cn } from '@/lib/utils';
import type { OrganizerEventDTO } from '@eventhub/types';

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateEventInput>({
    resolver: zodResolver(updateEventSchema),
  });

  useEffect(() => {
    if (!auth?.accessToken || !id) return;
    void (async () => {
      const result = await getOrganizerEventDetailAction(id, auth.accessToken!);
      if (result.success && result.data) {
        setEvent(result.data);
        const organizerEvent = result.data as OrganizerEventDTO & { description?: string };
        // Pre-fill form
        reset({
          title: organizerEvent.title,
          description: organizerEvent.description ?? '',
          venue: organizerEvent.venue,
          location: organizerEvent.location,
          eventDate: organizerEvent.eventDate
            ? new Date(organizerEvent.eventDate).toISOString().slice(0, 16)
            : '',
          eventEndDate: organizerEvent.eventEndDate
            ? new Date(organizerEvent.eventEndDate).toISOString().slice(0, 16)
            : '',
          category:
            (organizerEvent.category as (typeof CATEGORIES)[number] | undefined) ?? undefined,
          tags: organizerEvent.tags,
        });
      }
      setLoading(false);
    })();
  }, [auth?.accessToken, id, reset]);

  async function onSubmit(data: UpdateEventInput) {
    if (!auth?.accessToken || !id) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const result = await updateEventAction(id, data, auth.accessToken);

    if (result.success) {
      setSuccessMsg('Event updated successfully.');
      setEvent((prev) => (prev ? { ...prev, ...(data as Partial<OrganizerEventDTO>) } : prev));
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
        <p className="text-gray-500">Event not found.</p>
        <button onClick={() => router.back()} className="mt-3 text-violet-600 text-sm">
          ← Back to events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Back + header */}
      <button
        onClick={() => router.push('/dashboard/events')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </button>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{event.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatDate(event.eventDate)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge
            status={event.isCancelled ? 'cancelled' : event.isPublished ? 'active' : 'inactive'}
          />
        </div>
      </div>

      {/* Feedback banners */}
      {successMsg && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Action buttons */}
      {!event.isCancelled && (
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => void handleTogglePublish()}
            disabled={actionLoading === 'publish'}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
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
            {event.isPublished ? 'Unpublish' : 'Publish Event'}
          </button>

          <button
            onClick={() => void handleCancel()}
            disabled={actionLoading === 'cancel'}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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

      {/* Edit form */}
      {!event.isCancelled && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Event Details</h2>

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
              <select {...register('category')} className={inputCls(false) + ' bg-white'}>
                <option value="">No category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Location & Date</h2>

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

          {/* Ticket types display (read-only in Phase 5 edit — full edit in Phase 9) */}
          {event.ticketTypes.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Ticket Types</h2>
              <div className="space-y-2">
                {event.ticketTypes.map((tt) => (
                  <div
                    key={tt.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{tt.name}</span>
                      <span className="ml-2 text-gray-400">
                        {tt.price === 0 ? 'FREE' : `₦${(tt.price / 100).toLocaleString()}`}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {tt.quantitySold}/{tt.quantity} sold
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Full ticket type editing available in the organizer dashboard (Phase 9).
              </p>
            </section>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/events')}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function inputCls(hasError: boolean): string {
  return cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors',
    hasError ? 'border-red-300 bg-red-50' : 'border-gray-200'
  );
}
