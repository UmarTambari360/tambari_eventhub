import { Calendar, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { OrderDTO } from '@eventhub/types';

interface OrderEventInfoProps {
  event: OrderDTO['event'];
}

export function OrderEventInfo({ event }: OrderEventInfoProps) {
  return (
    <Card className="border-border bg-surface-raised">
      <CardContent className="p-4">
        <p className="heading-sm text-text-primary">{event.title}</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 body-sm text-text-muted">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary-500" />
            {formatDate(event.eventDate, {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div className="flex items-center gap-1.5 body-sm text-text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-500" />
            {event.venue}, {event.location}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
