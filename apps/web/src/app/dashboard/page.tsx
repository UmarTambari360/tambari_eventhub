'use client';

import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function DashboardPage() {
  const auth = useAuth();

  if (!auth || auth.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome back, {auth.user?.fullName ? auth.user.fullName.split(' ')[0] : 'Organizer'}
      </h1>
      <p className="text-gray-600 mb-8">
        Your organizer dashboard is ready. Events and analytics coming in Phase 5.
      </p>

      {/* PHASE 5: Stats cards, revenue chart, recent orders */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-gray-400 text-sm">
          Dashboard content builds in Phase 5 (Events & Ticket Types)
        </p>
      </div>
    </div>
  );
}
