'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Star } from 'lucide-react';
import type { AdminEventRow } from '@/actions/admin/events.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventActionButtons } from './event-action-buttons';

interface EventsTableProps {
  events: AdminEventRow[];
  actionLoading: string | null;
  onFeatureToggle: (event: AdminEventRow) => void;
  onCancel: (event: AdminEventRow) => void;
}

export function EventsTable({
  events,
  actionLoading,
  onFeatureToggle,
  onCancel,
}: EventsTableProps) {
  const getStatusBadge = (event: AdminEventRow) => {
    if (event.isCancelled) {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (event.isPublished) {
      return <Badge className="bg-success-light text-success border-success-200">Published</Badge>;
    }
    return (
      <Badge variant="outline" className="text-text-muted border-border">
        Draft
      </Badge>
    );
  };

  return (
    <Card className="border-border bg-surface-overlay overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-raised">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-text-muted caption font-medium">Event</TableHead>
                <TableHead className="text-text-muted caption font-medium hidden lg:table-cell">
                  Organizer
                </TableHead>
                <TableHead className="text-text-muted caption font-medium hidden md:table-cell">
                  Date
                </TableHead>
                <TableHead className="text-text-muted caption font-medium">Status</TableHead>
                <TableHead className="text-text-muted caption font-medium hidden sm:table-cell">
                  Featured
                </TableHead>
                <TableHead className="text-text-muted caption font-medium text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event.id}
                  className="border-border hover:bg-surface-raised transition-colors"
                >
                  <TableCell className="py-3">
                    <div className="space-y-0.5">
                      <Link
                        href={`/events/${event.slug}`}
                        target="_blank"
                        className="font-medium text-text-primary hover:text-primary-600 transition-colors line-clamp-1"
                      >
                        {event.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-text-muted text-xs">
                          {event.isFree ? 'Free' : 'Paid'}
                        </span>
                        {event.category && (
                          <>
                            <span className="text-text-muted text-xs">·</span>
                            <span className="text-text-muted text-xs">{event.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 hidden lg:table-cell">
                    <span className="text-text-secondary text-sm">
                      {event.organizerBusiness ?? event.organizerName ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    <span className="text-text-muted text-sm whitespace-nowrap">
                      {formatDate(event.eventDate)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">{getStatusBadge(event)}</TableCell>
                  <TableCell className="py-3 hidden sm:table-cell">
                    {event.isFeatured && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-current text-accent-500" />
                        <span className="text-text-muted text-xs font-medium">
                          #{event.featureOrder ?? '—'}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <EventActionButtons
                      event={event}
                      isLoading={actionLoading === event.id}
                      onFeatureToggle={onFeatureToggle}
                      onCancel={onCancel}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
