'use client';

import { formatDate, cn } from '@/lib/utils';
import type { AttendeeDTO } from '@eventhub/types';
import { CheckCircle, XCircle, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AttendeeListProps {
  attendees: AttendeeDTO[];
}

export function AttendeeList({ attendees }: AttendeeListProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader className="pb-3">
        <CardTitle className="text-text-muted overline text-xs tracking-wider">
          Attendees ({attendees.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attendees.map((attendee) => (
            <div
              key={attendee.id}
              className={cn(
                'rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors',
                attendee.isRevoked
                  ? 'border-danger-200 bg-danger-50 opacity-60'
                  : 'border-border bg-surface hover:bg-surface-raised'
              )}
            >
              <div className="min-w-0 flex-1 space-y-1">
                {/* Attendee Name */}
                <p className="heading-sm text-text-primary">
                  {attendee.firstName} {attendee.lastName}
                </p>

                {/* Ticket Type */}
                <p className="text-text-secondary text-sm">{attendee.ticketTypeName}</p>

                {/* Ticket Code */}
                <p className="text-text-muted text-xs font-mono">{attendee.ticketCode}</p>

                {/* Status Indicators */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {attendee.isCheckedIn && (
                    <Badge
                      variant="default"
                      className="bg-success-light text-success border-success-200 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Checked in {attendee.checkedInAt ? formatDate(attendee.checkedInAt) : ''}
                    </Badge>
                  )}
                  {attendee.isRevoked && (
                    <Badge
                      variant="destructive"
                      className="bg-danger-light text-danger border-danger-200 text-xs"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Revoked
                    </Badge>
                  )}
                </div>
              </div>

              {/* QR Code */}
              {attendee.qrCodeUrl && (
                <a
                  href={attendee.qrCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 relative group"
                  aria-label="View QR Code"
                >
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attendee.qrCodeUrl}
                      alt={`QR Code for ${attendee.firstName} ${attendee.lastName}`}
                      className="h-16 w-16 rounded-lg border border-border transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors">
                      <QrCode className="h-5 w-5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </a>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
