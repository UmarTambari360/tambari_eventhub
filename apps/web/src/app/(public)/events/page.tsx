import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { EventCard } from '@/components/public/event-card';
import { CategoryFilterBar } from '@/components/public/category-filter-bar';
import { getPublishedEventsAction } from '@/actions/event.actions';

export const metadata: Metadata = {
  title: 'Browse Events',
  description:
    'Discover the best events happening across Nigeria — music, tech, arts, culture and more.',
};

interface EventsPageProps {
  searchParams: Promise<Record<string, string>>;
}

async function EventsGrid({ params }: { params: Record<string, string> }) {
  const result = await getPublishedEventsAction(params);

  if (!result.success || !result.data) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
        <p className="text-gray-400">Unable to load events. Please try again.</p>
      </div>
    );
  }

  const { items, total, page, totalPages } = result.data;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
        <p className="text-2xl mb-2">🔍</p>
        <p className="text-gray-500 font-medium">No events found</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        Showing {items.length} of {total} event{total !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Pagination links */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildPageUrl(params, page - 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildPageUrl(params, page + 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

function buildPageUrl(params: Record<string, string>, page: number): string {
  const p = new URLSearchParams(params);
  p.set('page', String(page));
  return `/events?${p.toString()}`;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Upcoming Events</h1>
        <p className="text-gray-500">Discover amazing events happening across Nigeria</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <form method="GET">
          {/* Preserve other params */}
          {Object.entries(params)
            .filter(([k]) => k !== 'search' && k !== 'page')
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <input
            name="search"
            defaultValue={params['search'] ?? ''}
            placeholder="Search events, venues, cities..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          />
        </form>
      </div>

      {/* Category filter */}
      <div className="mb-6">
        <Suspense>
          <CategoryFilterBar />
        </Suspense>
      </div>

      {/* Results */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-gray-50 h-72 animate-pulse"
              />
            ))}
          </div>
        }
      >
        <EventsGrid params={params} />
      </Suspense>
    </div>
  );
}
