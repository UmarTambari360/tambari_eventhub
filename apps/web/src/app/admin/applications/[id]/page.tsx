'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { getApplicationsAction } from '@/actions/admin.actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';
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

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-xl text-(--text-primary)">Organizer Applications</h1>
        <p className="body-sm text-(--text-muted) mt-1">
          Review and manage organizer applications
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-(--border)">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              router.push(`/admin/applications?status=${tab.value}`);
              setPage(1);
            }}
            className={cn(
              'px-4 py-2.5 body-sm font-medium border-b-2 transition-colors -mb-px',
              statusParam === tab.value
                ? 'border-(--primary) text-(--primary)'
                : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : applications.length === 0 ? (
        <div className="card border-dashed p-12 text-center">
          <p className="text-(--text-muted) body-sm">
            No {statusParam === 'all' ? '' : statusParam} applications found.
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-(--surface-raised) border-b border-(--border)">
                <tr>
                  {['Business', 'Applicant', 'Status', 'Submitted', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left caption text-(--text-muted)">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-(--surface-raised) transition-colors">
                    <td className="px-5 py-4">
                      <p className="heading-sm text-(--text-primary)">{app.businessName}</p>
                      {app.bankName && (
                        <p className="caption text-(--text-muted) mt-0.5">{app.bankName}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="body-sm text-(--text-primary)">{app.user.fullName}</p>
                      <p className="caption text-(--text-muted)">{app.user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={app.status as 'pending' | 'approved' | 'rejected'} />
                    </td>
                    <td className="px-5 py-4 body-sm text-(--text-muted)">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="body-sm font-semibold text-(--primary) hover:text-(--primary-hover)"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between body-sm text-(--text-muted)">
              <span>
                Showing {applications.length} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-ghost btn-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-ghost btn-sm disabled:opacity-40"
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
