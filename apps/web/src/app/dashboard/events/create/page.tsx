'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { createEventSchema, type CreateEventInput } from '@eventhub/validators';
import { useAuth } from '@/hooks/use-auth';
import { createEventAction } from '@/actions/event.actions';
import { cn, formatNaira } from '@/lib/utils';

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

export default function CreateEventPage() {
  const auth = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      tags: [],
      ticketTypes: [
        {
          name: '',
          price: 0,
          quantity: 100,
          minPurchase: 1,
          maxPurchase: 10,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ticketTypes',
  });

  async function onSubmit(data: CreateEventInput) {
    if (!auth?.accessToken) return;
    setSubmitting(true);
    setSubmitError(null);

    const result = await createEventAction(data, auth.accessToken);

    if (result.success && result.data) {
      router.push(`/dashboard/events/${result.data.id}`);
    } else {
      setSubmitError(result.error ?? 'Failed to create event');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
        <p className="text-gray-500 text-sm mt-0.5">Fill in your event details and ticket types</p>
      </div>

      {submitError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        {/* ── Event Details ── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Event Details</h2>

          {/* Title */}
          <div>
            <label className="label-text">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              className={inputCls(!!errors.title)}
              placeholder="e.g. Lagos Music Festival 2025"
            />
            {errors.title && <p className="field-error">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="label-text">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={5}
              className={inputCls(!!errors.description) + ' resize-none'}
              placeholder="Tell attendees what to expect at your event..."
            />
            {errors.description && <p className="field-error">{errors.description.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="label-text">Category</label>
            <select {...register('category')} className={inputCls(false) + ' bg-white'}>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ── Location & Date ── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Location & Date</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-text">
                Venue <span className="text-red-500">*</span>
              </label>
              <input
                {...register('venue')}
                className={inputCls(!!errors.venue)}
                placeholder="e.g. Eko Atlantic Amphitheatre"
              />
              {errors.venue && <p className="field-error">{errors.venue.message}</p>}
            </div>

            <div>
              <label className="label-text">
                City / Location <span className="text-red-500">*</span>
              </label>
              <input
                {...register('location')}
                className={inputCls(!!errors.location)}
                placeholder="e.g. Lagos"
              />
              {errors.location && <p className="field-error">{errors.location.message}</p>}
            </div>
          </div>

          <div>
            <label className="label-text">Full Address (optional)</label>
            <input
              {...register('address')}
              className={inputCls(false)}
              placeholder="e.g. Plot 1, Eko Atlantic City, Victoria Island, Lagos"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-text">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                {...register('eventDate')}
                type="datetime-local"
                className={inputCls(!!errors.eventDate)}
              />
              {errors.eventDate && <p className="field-error">{errors.eventDate.message}</p>}
            </div>

            <div>
              <label className="label-text">End Date & Time (optional)</label>
              <input
                {...register('eventEndDate')}
                type="datetime-local"
                className={inputCls(false)}
              />
            </div>
          </div>
        </section>

        {/* ── Ticket Types ── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Ticket Types</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                At least one ticket type required. Set price to ₦0 for free tickets.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                append({ name: '', price: 0, quantity: 100, minPurchase: 1, maxPurchase: 10 })
              }
              disabled={fields.length >= 10}
              className="flex items-center gap-1.5 rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Ticket Type
            </button>
          </div>

          {errors.ticketTypes?.root && (
            <p className="field-error mb-4">{errors.ticketTypes.root.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, idx) => (
              <TicketTypeRow
                key={field.id}
                index={idx}
                register={register}
                errors={errors}
                canRemove={fields.length > 1}
                onRemove={() => remove(idx)}
              />
            ))}
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Ticket type row sub-component ─────────────────────────────────────────────

import type { UseFormRegister, FieldErrors } from 'react-hook-form';

interface TicketTypeRowProps {
  index: number;
  register: UseFormRegister<CreateEventInput>;
  errors: FieldErrors<CreateEventInput>;
  canRemove: boolean;
  onRemove: () => void;
}

function TicketTypeRow({ index, register, errors, canRemove, onRemove }: TicketTypeRowProps) {
  const [expanded, setExpanded] = useState(true);
  const ttErrors = errors.ticketTypes?.[index];

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-sm font-medium text-gray-700">Ticket Type {index + 1}</span>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Fields */}
      {expanded && (
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">
                Ticket Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register(`ticketTypes.${index}.name`)}
                className={inputCls(!!ttErrors?.name)}
                placeholder="e.g. General Admission"
              />
              {ttErrors?.name && <p className="field-error">{ttErrors.name.message}</p>}
            </div>

            <div>
              <label className="label-text">
                Price (₦) — enter 0 for free <span className="text-red-500">*</span>
              </label>
              <input
                {...register(`ticketTypes.${index}.price`, { valueAsNumber: true })}
                type="number"
                min={0}
                step={100}
                className={inputCls(!!ttErrors?.price)}
                placeholder="0"
              />
              {ttErrors?.price && <p className="field-error">{ttErrors.price.message}</p>}
              <p className="mt-0.5 text-xs text-gray-400">Enter in kobo (e.g. 1500000 = ₦15,000)</p>
            </div>
          </div>

          <div>
            <label className="label-text">Description (optional)</label>
            <input
              {...register(`ticketTypes.${index}.description`)}
              className={inputCls(false)}
              placeholder="What's included with this ticket?"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-text">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                {...register(`ticketTypes.${index}.quantity`, { valueAsNumber: true })}
                type="number"
                min={1}
                className={inputCls(!!ttErrors?.quantity)}
              />
              {ttErrors?.quantity && <p className="field-error">{ttErrors.quantity.message}</p>}
            </div>
            <div>
              <label className="label-text">Min per order</label>
              <input
                {...register(`ticketTypes.${index}.minPurchase`, { valueAsNumber: true })}
                type="number"
                min={1}
                className={inputCls(false)}
              />
            </div>
            <div>
              <label className="label-text">Max per order</label>
              <input
                {...register(`ticketTypes.${index}.maxPurchase`, { valueAsNumber: true })}
                type="number"
                min={1}
                max={20}
                className={inputCls(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function inputCls(hasError: boolean): string {
  return cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors',
    hasError ? 'border-red-300 bg-red-50' : 'border-gray-200'
  );
}
