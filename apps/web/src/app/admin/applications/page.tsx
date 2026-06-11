'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { getApplicationsAction } from '@/actions/admin.actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { OrganizerApplicationDTO } from '@eventhub/types';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminApplicationsPage() {
  const auth = useAuth();
  const accessToken = auth?.accessToken;
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = (searchParams.get('status') ?? 'pending') as StatusFilter;

  const [applications, setApplications] = useState<OrganizerApplicationDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    setLoading(true);
    void (async () => {
      const result = await getApplicationsAction(
        accessToken,
        statusParam === 'all' ? undefined : statusParam,
        page
      );

      if (result.success && result.data) {
        setApplications(result.data.applications);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
      setLoading(false);
    })();
  }, [accessToken, statusParam, page]);

  const filterOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organizer Applications</h1>
        <p className="text-gray-600 mt-1">Review and manage organizer applications</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              router.push(`/admin/applications?status=${opt.value}`);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusParam === opt.value
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-400">
            No {statusParam === 'all' ? '' : statusParam} applications found.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Business</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Applicant</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Submitted</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.businessName}</div>
                      {app.bankName && (
                        <div className="text-xs text-gray-400 mt-0.5">{app.bankName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{app.user.fullName}</div>
                      <div className="text-xs text-gray-400">{app.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status as 'pending' | 'approved' | 'rejected'} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(app.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="text-violet-600 hover:text-violet-800 font-medium"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>
                Showing {applications.length} of {total} applications
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
