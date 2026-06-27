import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getApplicationsAction } from '@/actions/admin/applications.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { OrganizerApplicationDTO } from '@eventhub/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApplicationsTable } from '@/components/admin/applications/applications-table';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All Applications', value: 'all' },
];

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

  const handleFilterChange = (value: StatusFilter) => {
    router.push(`/admin/applications?status=${value}`);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="heading-xl text-text-primary">Organizer Applications</h1>
        <p className="text-text-secondary text-sm">Review and manage organizer applications</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant="ghost"
            size="sm"
            onClick={() => handleFilterChange(opt.value)}
            className={`
              rounded-none border-b-2 px-4 py-2.5 h-auto text-sm font-medium
              transition-colors -mb-px
              ${
                statusParam === opt.value
                  ? 'border-primary-600 text-text-primary hover:text-text-primary hover:bg-transparent'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:bg-transparent'
              }
            `}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-dashed border-border bg-surface-overlay">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-text-secondary text-sm">
              No {statusParam === 'all' ? '' : statusParam} applications found.
            </p>
            {statusParam !== 'all' && (
              <Button
                variant="link"
                onClick={() => handleFilterChange('all')}
                className="text-primary-600 mt-2"
              >
                View all applications
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Applications Table */}
          <ApplicationsTable applications={applications} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-sm text-text-muted">
              <span>
                Showing {applications.length} of {total} applications
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-border text-text-secondary hover:bg-surface-raised"
                >
                  Previous
                </Button>
                <Badge variant="outline" className="px-3 py-1.5 text-text-primary border-border">
                  {page} / {totalPages}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-border text-text-secondary hover:bg-surface-raised"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
