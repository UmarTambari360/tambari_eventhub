'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getOrganizerEventsAction } from '@/actions/event.actions';

export default function DashboardPage() {
  const auth = useAuth();
  const [eventCount, setEventCount] = useState<number | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) return;
    void (async () => {
      const result = await getOrganizerEventsAction(auth.accessToken!);
      if (result.success && result.data) {
        setEventCount(result.data.total);
      }
    })();
  }, [auth?.accessToken]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome back, {auth?.user?.fullName?.split(' ')[0] ?? 'Organizer'}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Manage your events, track ticket sales, and monitor revenue.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Link
          href="/dashboard/events"
          className="rounded-xl border border-violet-100 bg-violet-50 p-6 hover:bg-violet-100 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <CalendarDays className="h-5 w-5 text-violet-600" />
            <span className="text-2xl font-bold text-violet-700">{eventCount ?? '—'}</span>
          </div>
          <div className="text-sm font-medium text-violet-800">My Events</div>
          <div className="text-xs text-violet-500 mt-0.5">Manage events →</div>
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-2xl font-bold text-gray-300 mb-1">—</div>
          <div className="text-sm font-medium text-gray-500">Total Tickets Sold</div>
          <div className="text-xs text-gray-400 mt-0.5">Phase 9</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-2xl font-bold text-gray-300 mb-1">—</div>
          <div className="text-sm font-medium text-gray-500">Revenue This Month</div>
          <div className="text-xs text-gray-400 mt-0.5">Phase 9</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/events/create"
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create New Event
          </Link>
          <Link
            href="/dashboard/events"
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View All Events
          </Link>
        </div>
      </div>

      {/* Revenue chart placeholder */}
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-400 text-sm">
          Revenue analytics and order management build in Phase 9.
        </p>
      </div>
    </div>
  );
}
