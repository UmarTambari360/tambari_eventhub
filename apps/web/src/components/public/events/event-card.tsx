'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { formatDate, formatNaira } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { EventListItemDTO } from '@eventhub/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  event: EventListItemDTO;
}

export function EventCard({ event }: EventCardProps) {
  const formattedDate = formatDate(event.eventDate, {
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
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      <Card className="overflow-hidden hover:shadow-card-lg transition-shadow duration-200 border-border group">
        <Link href={`/events/${event.slug}`} className="block">
          {/* Image */}
          <div className="relative h-44 bg-surface-sunken overflow-hidden">
            {(event.thumbnailUrl ?? event.bannerImageUrl) ? (
              <Image
                src={(event.thumbnailUrl ?? event.bannerImageUrl)!}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                width={400}
                height={176}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-4xl opacity-30"></span>
              </div>
            )}

            {/* Category pill */}
            {event.category && (
              <Badge
                variant="secondary"
                className="absolute top-3 left-3 backdrop-blur-sm bg-surface-overlay/90 text-text-secondary"
              >
                {event.category}
              </Badge>
            )}

            {/* Price badge */}
            <Badge
              className={cn(
                'absolute top-3 right-3',
                event.isFree
                  ? 'bg-success text-white hover:bg-success'
                  : 'bg-primary-600 text-white hover:bg-primary-600'
              )}
            >
              {priceLabel}
            </Badge>

            {/* Cancelled overlay */}
            {event.isCancelled && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="destructive" className="text-sm px-4 py-1.5">
                  Cancelled
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-4">
            <h3 className="heading-sm text-text-primary mb-2 line-clamp-2 group-hover:text-brand transition-colors">
              {event.title}
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 caption text-text-muted">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-brand" />
                <span className="truncate">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 caption text-text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" />
                <span className="truncate">
                  {event.venue}, {event.location}
                </span>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}
