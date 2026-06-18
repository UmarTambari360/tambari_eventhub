export interface CalendarEventDetails {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate?: Date | null;
  url?: string;
}

/**
 * Build a Google Calendar "add event" URL.
 */
export function buildGoogleCalendarUrl(event: CalendarEventDetails): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const end = event.endDate ?? new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmt(event.startDate)}/${fmt(end)}`,
    details: event.description + (event.url ? `\n\nTickets: ${event.url}` : ''),
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Build a "webcal://" URL for Apple Calendar / Outlook via .ics download.
 * Returns a data: URI for the .ics blob.
 */
export function buildIcsDataUri(event: CalendarEventDetails): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const end = event.endDate ?? new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000);
  const now = fmt(new Date());

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventHub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(event.startDate)}`,
    `DTEND:${fmt(end)}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${event.title.replace(/\n/g, '\\n')}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    ...(event.url ? [`URL:${event.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}