import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { EventCard } from '@/components/public/event-card';
import { CategoryFilterBar } from '@/components/public/category-filter-bar';
import { getPublishedEventsAction } from '@/actions/event.actions';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
      <Card className="border-dashed border-2 border-border py-20 text-center">
        <CardContent>
          <p className="text-text-muted">Unable to load events. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const { items, total, page, totalPages } = result.data;

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-2 border-border py-20 text-center">
        <CardContent>
          <p className="text-4xl mb-3">🔍</p>
          <p className="heading-md text-text-primary mb-1">No events found</p>
          <p className="body-sm text-text-muted">Try adjusting your filters</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <p className="body-sm text-text-muted mb-4">
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
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border text-text-secondary hover:bg-surface-raised"
            >
              <Link href={buildPageUrl(params, page - 1)}>← Previous</Link>
            </Button>
          )}
          <span className="body-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border text-text-secondary hover:bg-surface-raised"
            >
              <Link href={buildPageUrl(params, page + 1)}>Next →</Link>
            </Button>
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
        <h1 className="display-md text-text-primary mb-1">Upcoming Events</h1>
        <p className="body-md text-text-muted">Discover amazing events happening across Nigeria</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <form method="GET">
          {/* Preserve other params */}
          {Object.entries(params)
            .filter(([k]) => k !== 'search' && k !== 'page')
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <Input
            name="search"
            defaultValue={params['search'] ?? ''}
            placeholder="Search events, venues, cities..."
            className="w-full pl-10 input-base"
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
              <Card key={i} className="h-72 animate-pulse bg-surface-sunken border-border" />
            ))}
          </div>
        }
      >
        <EventsGrid params={params} />
      </Suspense>
    </div>
  );
}
