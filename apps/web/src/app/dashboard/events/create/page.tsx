'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { createEventSchema, type CreateEventInput } from '@eventhub/validators';
import { useAuth } from '@/hooks/use-auth';
import { createEventAction } from '@/actions/event.actions';
import { ImageUpload } from '@/components/shared/image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TicketTypeSection } from '@/components/organizer/ticket-types-section';
import { EventDetailsSection } from '@/components/organizer/event-details-section';
import { LocationDateSection } from '@/components/organizer/location-date-section';

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

// Form-only schema: dates are plain datetime-local strings, validated
// for presence/format, NOT transformed to ISO. Keeps RHF state stable.
// This prevents the timing/format mismatch where Zod's ISO conversion
// would flow back into the datetime-local input and break it.
const createEventFormSchema = createEventSchema.extend({
  eventDate: z
    .string({ required_error: 'Event date is required' })
    .min(1, 'Event date is required'),
  eventEndDate: z.string().optional().or(z.literal('')),
});

type CreateEventFormValues = z.infer<typeof createEventFormSchema>;

export default function CreateEventPage() {
  const auth = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
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
    control: form.control,
    name: 'ticketTypes',
  });

  // Watch image fields for the ImageUpload component
  const bannerImageUrl = form.watch('bannerImageUrl');
  const thumbnailUrl = form.watch('thumbnailUrl');

  async function onSubmit(data: CreateEventFormValues) {
    if (!auth?.accessToken) return;
    setSubmitting(true);
    setSubmitError(null);

    // Convert datetime-local -> ISO ONLY here, right before sending to the API.
    // This never touches RHF's live field state, keeping the input happy
    // with its expected YYYY-MM-DDTHH:mm format at all times.
    const payload: CreateEventInput = {
      ...data,
      eventDate: new Date(data.eventDate).toISOString(),
      eventEndDate: data.eventEndDate ? new Date(data.eventEndDate).toISOString() : '',
    };

    const result = await createEventAction(payload, auth.accessToken);

    if (result.success && result.data) {
      router.push(`/dashboard/events/${result.data.id}`);
    } else {
      setSubmitError(result.error ?? 'Failed to create event');
      setSubmitting(false);
    }
  }

  if (!auth?.accessToken) return null;

  return (
    <div className="max-w-3xl">
      {/* Page Header */}
      <div className="mb-8 space-y-1">
        <h1 className="heading-xl text-text-primary">Create Event</h1>
        <p className="text-text-secondary text-sm">Fill in your event details and ticket types</p>
      </div>

      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-8">
          {/* Event Details Section */}
          <EventDetailsSection form={form} categories={CATEGORIES} />

          {/* Images Section */}
          <Card className="border-border bg-surface-overlay">
            <CardHeader>
              <CardTitle className="text-text-primary">Event Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUpload
                type="event-banner"
                value={bannerImageUrl ?? ''}
                publicId={form.watch('bannerPublicId') ?? ''}
                accessToken={auth.accessToken}
                label="Banner Image"
                hint="Recommended: 1920×1080px (16:9). Shown on the event detail page."
                aspectRatio="16/9"
                onChange={(result) => {
                  form.setValue('bannerImageUrl', result?.url ?? '');
                  form.setValue('bannerPublicId', result?.publicId ?? '');
                }}
              />

              <ImageUpload
                type="event-thumbnail"
                value={thumbnailUrl ?? ''}
                publicId={form.watch('thumbnailPublicId') ?? ''}
                accessToken={auth.accessToken}
                label="Thumbnail Image"
                hint="Recommended: 800×600px (4:3). Shown in event listings and search results."
                aspectRatio="4/3"
                onChange={(result) => {
                  form.setValue('thumbnailUrl', result?.url ?? '');
                  form.setValue('thumbnailPublicId', result?.publicId ?? '');
                }}
              />
            </CardContent>
          </Card>

          {/* Location & Date Section */}
          <LocationDateSection form={form} />

          {/* Ticket Types Section */}
          <TicketTypeSection
            fields={fields}
            form={form}
            onAppend={append}
            onRemove={remove}
            canRemove={fields.length > 1}
          />

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-border text-text-secondary hover:bg-surface-raised"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="btn-primary min-w-[140px]">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Event
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}