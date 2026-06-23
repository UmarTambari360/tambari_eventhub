import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TrustBar } from "@/components/public/trust-bar";
import { HeroSection } from '@/components/public/hero-section'
import { getFeaturedEventsAction } from '@/actions/event.actions';
import { HowItWorksSection } from '@/components/public/how-it-works';
import { EventCardSkeleton } from '@/components/shared/event-skeleton';
import { FeaturedCarousel } from '@/components/public/featured-carousel';
import { CategoryStrip } from '@/components/public/events-category-strip';
import { UpcomingEventsSection } from '@/components/public/upcoming-events-section';
import { OrganizerCTASection } from '@/components/public/organizer-cta-section';

export const metadata: Metadata = {
  title: "Tambari EventHub — Nigeria's Event Ticketing Platform",
  description:
    'Discover and book tickets for the best events in Nigeria. Music, tech, arts, culture, comedy and more. Fast checkout, instant QR tickets.',
};

export const revalidate = 300; // 5 min

async function FeaturedSection() {
  const result = await getFeaturedEventsAction();
  if (!result.success || !result.data || result.data.length === 0) return null;
  return (
    <section className="mb-16">
      <FeaturedCarousel events={result.data} />
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <HeroSection />
      <CategoryStrip />

      <Suspense fallback={null}>
        <FeaturedSection />
      </Suspense>

      <Suspense
        fallback={
          <section className="mb-16">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="skeleton h-3 w-24 mb-2 rounded" />
                <div className="skeleton h-8 w-48 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          </section>
        }
      >
        <UpcomingEventsSection />
      </Suspense>

      <HowItWorksSection />
      <TrustBar />
      <OrganizerCTASection />
    </div>
  );
}
