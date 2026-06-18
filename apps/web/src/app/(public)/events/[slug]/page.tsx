import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Users, Tag, ExternalLink } from 'lucide-react';
import { getEventBySlugAction } from '@/actions/event.actions';
import { EventTicketSelectorWrapper } from '@/components/public/event-ticket-selector-wrapper';
import { AddToCalendar } from '@/components/public/add-to-calendar';
import { SocialShare } from '@/components/public/social-share';
import { formatDate } from '@/lib/utils';

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getEventBySlugAction(slug);

  if (!result.success || !result.data) {
    return { title: 'Event Not Found' };
  }

  const event = result.data;
  const description = event.description.slice(0, 160);

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      images: event.bannerImageUrl
        ? [{ url: event.bannerImageUrl, width: 1200, height: 630, alt: event.title }]
        : [],
      type: 'website',
      siteName: 'EventHub',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: event.bannerImageUrl ? [event.bannerImageUrl] : [],
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const result = await getEventBySlugAction(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const event = result.data;

  if (!event.isPublished && !event.isCancelled) {
    notFound();
  }

  const startDate = formatDate(event.eventDate, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const startTime = new Intl.DateTimeFormat('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Lagos',
  }).format(new Date(event.eventDate));

  // const eventUrl =
    // typeof window === 'undefined'
      // ? `https://eventhub.ng/events/${event.slug}`
      // : `${window.location.origin}/events/${event.slug}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Banner */}
          <div className="relative mb-6 h-72 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-100">
            {event.bannerImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.bannerImageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-6xl">🎪</div>
            )}

            {event.isCancelled && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="rounded-2xl bg-red-500 px-6 py-2 text-lg font-bold text-white">
                  This Event Has Been Cancelled
                </span>
              </div>
            )}

            {event.isFeatured && !event.isCancelled && (
              <span className="absolute top-4 left-4 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-900">
                ⭐ Featured
              </span>
            )}
          </div>

          {/* Category + tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {event.category && (
              <span className="rounded-full bg-violet-100 text-violet-700 px-3 py-1 text-xs font-medium">
                {event.category}
              </span>
            )}
            {event.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs">
                #{tag}
              </span>
            ))}
          </div>

          {/* Title + share */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-(--text-primary) leading-tight">
              {event.title}
            </h1>
            <SocialShare
              url={`/events/${event.slug}`}
              title={event.title}
              className="shrink-0 mt-1"
            />
          </div>

          {/* Event details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3 rounded-xl border border-(--border) p-4">
              <Calendar className="h-5 w-5 text-violet-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-(--text-muted) uppercase tracking-wide font-medium mb-0.5">
                  Date & Time
                </p>
                <p className="text-sm font-medium text-(--text-primary)">{startDate}</p>
                <p className="text-sm text-(--text-muted)">{startTime} WAT</p>
                {event.eventEndDate && (
                  <p className="text-xs text-(--text-muted) mt-0.5">
                    Ends{' '}
                    {formatDate(event.eventEndDate, {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-(--border) p-4">
              <MapPin className="h-5 w-5 text-violet-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-(--text-muted) uppercase tracking-wide font-medium mb-0.5">
                  Location
                </p>
                <p className="text-sm font-medium text-(--text-primary)">{event.venue}</p>
                <p className="text-sm text-(--text-muted)">{event.location}</p>
                {event.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 mt-1"
                  >
                    View on map <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {event.totalCapacity && (
              <div className="flex items-start gap-3 rounded-xl border border-(--border) p-4">
                <Users className="h-5 w-5 text-violet-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-(--text-muted) uppercase tracking-wide font-medium mb-0.5">
                    Capacity
                  </p>
                  <p className="text-sm font-medium text-(--text-primary)">
                    {event.totalCapacity.toLocaleString('en-NG')} attendees
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-xl border border-(--border) p-4">
              <Tag className="h-5 w-5 text-violet-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-(--text-muted) uppercase tracking-wide font-medium mb-0.5">
                  Organizer
                </p>
                <p className="text-sm font-medium text-(--text-primary)">
                  {event.organizer.businessName ?? event.organizer.fullName}
                </p>
              </div>
            </div>
          </div>

          {/* Add to calendar */}
          {!event.isCancelled && (
            <div className="mb-8">
              <AddToCalendar
                title={event.title}
                description={event.description}
                location={`${event.venue}, ${event.location}${event.address ? `, ${event.address}` : ''}`}
                startDate={new Date(event.eventDate)}
                endDate={event.eventEndDate ? new Date(event.eventEndDate) : null}
                url={`https://eventhub.ng/events/${event.slug}`}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold text-(--text-primary) mb-3">About this event</h2>
            <div className="prose prose-sm max-w-none text-(--text-secondary) leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>
        </div>

        {/* Sidebar — ticket selector */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {event.isCancelled ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="font-semibold text-red-700">Event Cancelled</p>
                <p className="text-sm text-red-600 mt-1">
                  This event has been cancelled. If you purchased tickets, you will be refunded.
                </p>
              </div>
            ) : (
              <EventTicketSelectorWrapper event={event} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
