'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarPlus, ChevronDown, X } from 'lucide-react';
import { buildGoogleCalendarUrl, buildIcsDataUri } from '@/lib/calendar';
import { cn } from '@/lib/utils';

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
  const ref = useRef<HTMLDivElement>(null);

  const eventDetails = {
    title,
    description,
    location,
    startDate,
    endDate: endDate ?? null,
    url: url ?? null,
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div ref={ref} className={cn('relative inline-block', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-overlay) px-4 py-2.5 text-sm font-medium text-(--text-secondary) hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all"
      >
        <CalendarPlus className="h-4 w-4" />
        Add to calendar
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-(--border) bg-(--surface-overlay) shadow-card-lg z-20 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-(--border)">
            <p className="caption font-semibold text-(--text-muted) uppercase tracking-wide">
              Add to calendar
            </p>
            <button onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5 text-(--text-muted)" />
            </button>
          </div>
          {options.map((opt) => (
            <a
              key={opt.label}
              href={opt.href}
              target={opt.external ? '_blank' : undefined}
              rel={opt.external ? 'noopener noreferrer' : undefined}
              download={opt.download}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-(--text-secondary) hover:bg-(--surface-raised) hover:text-(--text-primary) transition-colors"
            >
              <span className="text-base">{opt.icon}</span>
              {opt.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
