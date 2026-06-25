'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarPlus, ChevronDown, X } from 'lucide-react';
import { buildGoogleCalendarUrl, buildIcsDataUri } from '@/lib/calendar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';

interface AddToCalendarProps {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate?: Date | null;
  url?: string;
  className?: string;
}

export function AddToCalendar({
  title,
  description,
  location,
  startDate,
  endDate,
  url,
  className,
}: AddToCalendarProps) {
  const [open, setOpen] = useState(false);

  const eventDetails = {
    title,
    description,
    location,
    startDate,
    endDate: endDate ?? null,
    url: url ?? '',
  };

  const options = [
    {
      label: 'Google Calendar',
      icon: '📅',
      href: buildGoogleCalendarUrl(eventDetails),
      external: true,
    },
    {
      label: 'Apple Calendar / Outlook (.ics)',
      icon: '🗓️',
      href: buildIcsDataUri(eventDetails),
      download: `${title.toLowerCase().replace(/\s+/g, '-')}.ics`,
      external: false,
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'border-border text-text-secondary hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50',
            className
          )}
        >
          <CalendarPlus className="h-4 w-4" />
          Add to calendar
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 border-border">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="caption font-semibold text-text-muted uppercase tracking-wide">
                Add to calendar
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-text-muted hover:text-text-primary"
                onClick={() => setOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            {options.map((opt) => (
              <a
                key={opt.label}
                href={opt.href}
                target={opt.external ? '_blank' : undefined}
                rel={opt.external ? 'noopener noreferrer' : undefined}
                download={opt.download}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
              >
                <span className="text-base">{opt.icon}</span>
                {opt.label}
              </a>
            ))}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
