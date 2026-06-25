import { getPublishedEventsAction } from '@/actions/event.actions';
import { Link, ArrowRight } from 'lucide-react';
import { EventCard } from './events/event-card';

export async function UpcomingEventsSection() {
  const result = await getPublishedEventsAction({ limit: '8', sortBy: 'date' });

  if (!result.success || !result.data || result.data.items.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="overline text-text-muted mb-1">Don't miss out</p>
          <h2 className="display-md text-text-primary">Upcoming Events</h2>
        </div>
        <Link
          href="/events"
          className="hidden sm:flex items-center gap-1.5 body-sm font-semibold text-brand hover:underline"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.data.items.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      <div className="mt-6 text-center sm:hidden">
        <Link href="/events" className="btn btn-ghost btn-md">
          View all events <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
