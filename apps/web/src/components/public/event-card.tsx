'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { formatDate, formatNaira } from '@/lib/utils';
import type { EventListItemDTO } from '@eventhub/types';

interface EventCardProps {
  event: EventListItemDTO;
}

export function EventCard({ event }: EventCardProps) {
  const formattedDate = formatDate(event.eventDate, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const priceLabel = event.isFree
    ? 'FREE'
    : event.lowestPrice
      ? `From ${formatNaira(event.lowestPrice)}`
      : 'Tickets available';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <Link href={`/events/${event.slug}`} className="block">
        {/* Banner image */}
        <div className="relative h-48 bg-gradient-to-br from-violet-100 to-indigo-100 overflow-hidden">
          {(event.thumbnailUrl ?? event.bannerImageUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(event.thumbnailUrl ?? event.bannerImageUrl)!}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-4xl">🎪</span>
            </div>
          )}

          {/* Category pill */}
          {event.category && (
            <span className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-gray-700">
              {event.category}
            </span>
          )}

          {/* Price badge */}
          <span
            className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
              event.isFree ? 'bg-green-500 text-white' : 'bg-violet-600 text-white'
            }`}
          >
            {priceLabel}
          </span>

          {/* Cancelled overlay */}
          {event.isCancelled && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-semibold text-white">
                Cancelled
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-violet-700 transition-colors">
            {event.title}
          </h3>

          <div className="space-y-1.5 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-violet-400" />
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-400" />
              <span className="truncate">
                {event.venue}, {event.location}
              </span>
            </div>
            {event.organizer.businessName && (
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                <span className="truncate text-xs">{event.organizer.businessName}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
