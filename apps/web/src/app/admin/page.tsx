'use client';

import { useAuth } from '@/hooks/use-auth';

export default function AdminDashboardPage() {
  const auth = useAuth();

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Platform Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Welcome back, {auth?.user?.fullName}. Full analytics coming in Phase 10.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {/* Quick links to functional pages */}

          <a
            href="/admin/applications?status=pending"
            className="rounded-xl border border-amber-200 bg-amber-50 p-6 hover:bg-amber-100 transition-colors"
          >
            <div className="text-2xl font-bold text-amber-700 mb-1">—</div>
            <div className="text-sm font-medium text-amber-800">Pending Applications</div>
            <div className="text-xs text-amber-600 mt-1">Review now →</div>
          </a>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">—</div>
            <div className="text-sm font-medium text-gray-700">Total Users</div>
            <div className="text-xs text-gray-400 mt-1">Phase 10</div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">—</div>
            <div className="text-sm font-medium text-gray-700">Platform Revenue</div>
            <div className="text-xs text-gray-400 mt-1">Phase 10</div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-400 text-sm">
            Platform analytics, revenue charts, and management tools build in Phase 10.
          </p>
        </div>
      </div>
    </>
  );
}
