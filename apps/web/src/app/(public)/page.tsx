import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, CalendarDays, Shield, Zap, TrendingUp } from 'lucide-react';
import { FeaturedCarousel } from '@/components/public/featured-carousel';
import { EventCard } from '@/components/public/event-card';
import { EventCardSkeleton } from '@/components/shared/event-skeleton';
import { getFeaturedEventsAction, getPublishedEventsAction } from '@/actions/event.actions';

export const metadata: Metadata = {
  title: "EventHub — Nigeria's Event Ticketing Platform",
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

async function UpcomingEventsSection() {
  const result = await getPublishedEventsAction({ limit: '8', sortBy: 'date' });
  if (!result.success || !result.data || result.data.items.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="overline text-(--text-muted) mb-1">Don't miss out</p>
          <h2 className="display-md text-(--text-primary)">Upcoming Events</h2>
        </div>
        <Link
          href="/events"
          className="hidden sm:flex items-center gap-1.5 body-sm font-semibold text-(--primary) hover:underline"
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

function HeroSection() {
  return (
    <section className="relative mb-16 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-6 py-20 sm:px-12 sm:py-28 text-white">
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl"
      />

      <div className="relative max-w-2xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 backdrop-blur-sm">
          🇳🇬 Nigeria's Event Platform
        </span>

        <h1 className="display-xl mb-6 leading-none">
          Your next
          <br />
          <span className="text-accent-300">great night</span>
          <br />
          starts here.
        </h1>

        <p className="body-lg mb-8 text-white/80 max-w-lg">
          Discover concerts, tech summits, art exhibitions, comedy shows and more happening across
          Nigeria. Book in seconds, get your QR ticket instantly.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/events" className="btn btn-xl bg-white text-primary-900 hover:bg-primary-50">
            Browse Events
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/become-an-organizer"
            className="btn btn-xl bg-white/10 text-white hover:bg-white/20 border border-white/20"
          >
            Host an Event
          </Link>
        </div>
      </div>
    </section>
  );
}

function CategoryStrip() {
  const categories = [
    { label: 'Music', icon: '🎵', href: '/events?category=Music' },
    { label: 'Tech', icon: '💻', href: '/events?category=Tech' },
    { label: 'Arts', icon: '🎨', href: '/events?category=Arts' },
    { label: 'Comedy', icon: '😂', href: '/events?category=Comedy' },
    { label: 'Business', icon: '📊', href: '/events?category=Business' },
    { label: 'Food', icon: '🍽️', href: '/events?category=Food' },
    { label: 'Sports', icon: '⚽', href: '/events?category=Sports' },
    { label: 'Religion', icon: '🙏', href: '/events?category=Religion' },
  ];

  return (
    <section className="mb-16">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="shrink-0 flex flex-col items-center gap-2 rounded-2xl border border-(--border) bg-(--surface-overlay) px-5 py-4 text-center hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all group"
          >
            <span className="text-2xl">{cat.icon}</span>
            <span className="caption font-semibold text-(--text-secondary) group-hover:text-primary-700 whitespace-nowrap">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: <CalendarDays className="h-6 w-6" />,
      step: '01',
      title: 'Find your event',
      description:
        'Browse events by category, city, or date. Filter by price — including hundreds of free events.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      step: '02',
      title: 'Book in seconds',
      description:
        'Select your tickets, fill in attendee details, and pay securely via card, bank transfer, or USSD through Paystack.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      step: '03',
      title: 'Show up and scan',
      description:
        'Your QR code ticket arrives by email instantly. Present it at the door — no printing needed.',
    },
  ];

  return (
    <section className="mb-16">
      <div className="text-center mb-10">
        <p className="overline text-(--text-muted) mb-2">Simple by design</p>
        <h2 className="display-md text-(--text-primary)">How it works</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.step}
            className="relative rounded-2xl border border-(--border) bg-(--surface-overlay) p-7"
          >
            {/* Connector line between cards (desktop) */}
            {i < steps.length - 1 && (
              <div
                aria-hidden
                className="hidden sm:block absolute top-10 -right-3 w-6 h-px bg-(--border) z-10"
              />
            )}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                {step.icon}
              </div>
              <span className="text-3xl font-black text-(--border-strong) tabular-nums select-none">
                {step.step}
              </span>
            </div>
            <h3 className="heading-md text-(--text-primary) mb-2">{step.title}</h3>
            <p className="body-sm text-(--text-muted) leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { value: '10,000+', label: 'Tickets sold' },
    { value: '200+', label: 'Events hosted' },
    { value: '50+', label: 'Organizers' },
    { value: '100%', label: 'Secure via Paystack' },
  ];

  return (
    <section className="mb-16 rounded-2xl bg-(--surface-raised) border border-(--border) px-8 py-10">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-black text-(--primary) mb-1">{stat.value}</p>
            <p className="body-sm text-(--text-muted)">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrganizerCTASection() {
  return (
    <section className="mb-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 px-8 py-14 sm:px-14 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative max-w-xl">
          <TrendingUp className="h-10 w-10 mb-4 text-white/80" />
          <h2 className="display-md mb-3">Ready to host your event?</h2>
          <p className="body-lg text-white/85 mb-8">
            List your event on EventHub and sell tickets directly to your audience. Revenue lands in
            your bank account via Paystack — no delays, no middlemen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/become-an-organizer"
              className="btn btn-xl bg-white text-accent-700 hover:bg-amber-50"
            >
              Apply to host
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/events"
              className="btn btn-xl bg-white/15 text-white hover:bg-white/25 border border-white/20"
            >
              Browse first
            </Link>
          </div>
        </div>
      </div>
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
