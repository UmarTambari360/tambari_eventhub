'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { formatDate, formatNaira } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { EventListItemDTO } from '@eventhub/types';

interface FeaturedCarouselProps {
  events: EventListItemDTO[];
}

export function FeaturedCarousel({ events }: FeaturedCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = events.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % count);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [count, paused]);

  if (count === 0) return null;

  const event = events[current]!;

  function prev() {
    setCurrent((c) => (c - 1 + count) % count);
  }
  function next() {
    setCurrent((c) => (c + 1) % count);
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide */}
      <motion.div
        key={current}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative h-[420px] md:h-[500px]"
      >
        {/* Background */}
        {event.bannerImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.bannerImageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          {event.category && (
            <span className="inline-block rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold text-white mb-3">
              {event.category}
            </span>
          )}
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight max-w-2xl">
            {event.title}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm mb-6">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(event.eventDate, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {event.venue}, {event.location}
            </span>
            <span className="font-semibold text-white">
              {event.isFree
                ? 'FREE'
                : event.lowestPrice
                  ? `From ${formatNaira(event.lowestPrice)}`
                  : ''}
            </span>
          </div>
          <Link
            href={`/events/${event.slug}`}
            className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-violet-50 transition-colors"
          >
            Get Tickets →
          </Link>
        </div>
      </motion.div>

      {/* Controls */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
