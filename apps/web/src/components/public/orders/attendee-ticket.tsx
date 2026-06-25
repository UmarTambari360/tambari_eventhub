import { QrCode } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderDTO } from '@eventhub/types';

interface AttendeeTicketProps {
  attendee: OrderDTO['attendees'][0];
}

export function AttendeeTicket({ attendee }: AttendeeTicketProps) {
  return (
    <Card
      className={cn(
        'border',
        attendee.isRevoked
          ? 'border-danger/20 bg-danger-light/50'
          : 'border-border bg-surface-raised'
      )}
    >
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="body-sm font-semibold text-text-primary truncate">
            {attendee.firstName} {attendee.lastName}
          </p>
          <p className="caption text-text-muted">{attendee.ticketTypeName}</p>
          <p className="caption font-mono text-text-muted mt-0.5">{attendee.ticketCode}</p>
          {attendee.isRevoked && (
            <Badge variant="destructive" className="mt-1">
              Revoked
            </Badge>
          )}
        </div>
        {attendee.qrCodeUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attendee.qrCodeUrl}
            alt={`QR code for ${attendee.ticketCode}`}
            className="h-16 w-16 rounded-lg shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-surface-sunken flex items-center justify-center shrink-0">
            <QrCode className="h-6 w-6 text-text-muted" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
