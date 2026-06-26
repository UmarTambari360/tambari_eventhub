'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { UpdateEventInput } from '@eventhub/validators';
import { cn } from '@/lib/utils';

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

interface EventDetailsFormProps {
  register: UseFormRegister<UpdateEventInput>;
  errors: FieldErrors<UpdateEventInput>;
  isCancelled: boolean;
}

function inputCls(hasError: boolean): string {
  return cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors bg-surface',
    hasError ? 'input-error' : 'border-border'
  );
}

export function EventDetailsForm({ register, errors, isCancelled }: EventDetailsFormProps) {
  if (isCancelled) {
    return (
      <div className="card p-8 text-center">
        <p className="body-sm text-text-muted">
          This event has been cancelled and cannot be edited.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="card p-5 space-y-5 border-border">
        <h2 className="heading-sm text-text-primary">Event Details</h2>

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
            className={cn(inputCls(!!errors.description), 'resize-none')}
          />
          {errors.description && <p className="field-error">{errors.description.message}</p>}
        </div>

        <div>
          <label className="label-text">Category</label>
          <select {...register('category')} className={cn(inputCls(false), 'bg-surface')}>
            <option value="">No category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="card p-5 space-y-5 border-border">
        <h2 className="heading-sm text-text-primary">Location & Date</h2>

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
    </div>
  );
}
