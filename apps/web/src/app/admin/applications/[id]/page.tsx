'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getApplicationDetailAction,
  approveApplicationAction,
  rejectApplicationAction,
} from '@/actions/admin/applications.actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate } from '@/lib/utils';
import type { OrganizerApplicationDTO } from '@eventhub/types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApplicantSection } from '@/components/admin/applications/applicant-section';
import { BusinessSection } from '@/components/admin/applications/business-section';
import { BankSection } from '@/components/admin/applications/bank-section';
import { RejectionReason } from '@/components/admin/applications/rejection-reason';
import { ReviewActions } from '@/components/admin/review-actions';

export default function ApplicationDetailPage() {
  const auth = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [app, setApp] = useState<OrganizerApplicationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.accessToken || !id) return;
    void (async () => {
      const result = await getApplicationDetailAction(id, auth.accessToken!);
      if (result.success && result.data) setApp(result.data);
      setLoading(false);
    })();
  }, [auth?.accessToken, id]);

  async function handleApprove() {
    if (!auth?.accessToken || !id) return;
    setActionLoading('approve');
    setError(null);
    const result = await approveApplicationAction(id, auth.accessToken);
    if (result.success) {
      setSuccess(
        'Application approved. Organizer has been notified and their Paystack subaccount created.'
      );
      setApp((prev) => (prev ? { ...prev, status: 'approved' } : prev));
    } else {
      setError(result.error ?? 'Failed to approve');
    }
    setActionLoading(null);
  }

  async function handleReject() {
    if (!auth?.accessToken || !id || !rejectionReason.trim()) return;
    setActionLoading('reject');
    setError(null);
    const result = await rejectApplicationAction(id, rejectionReason, auth.accessToken);
    if (result.success) {
      setSuccess('Application rejected. Applicant has been notified.');
      setApp((prev) => (prev ? { ...prev, status: 'rejected', rejectionReason } : prev));
      setShowRejectForm(false);
    } else {
      setError(result.error ?? 'Failed to reject');
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-text-secondary text-sm">Application not found.</p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-border text-text-secondary hover:bg-surface-raised"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/admin/applications')}
        className="text-text-muted hover:text-text-primary -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Applications
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="heading-xl text-text-primary">{app.businessName}</h1>
          <p className="text-text-secondary text-sm">
            Submitted {formatDate(app.createdAt)}
            {app.reviewedAt && ` · Reviewed ${formatDate(app.reviewedAt)}`}
          </p>
        </div>
        <StatusBadge status={app.status as 'pending' | 'approved' | 'rejected'} />
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="bg-success-light border-success-200 text-success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Application Sections */}
      <div className="space-y-5">
        <ApplicantSection user={app.user} />
        <BusinessSection application={app} />
        <BankSection application={app} />

        {app.status === 'rejected' && app.rejectionReason && (
          <RejectionReason reason={app.rejectionReason} />
        )}

        {app.status === 'pending' && (
          <ReviewActions
            actionLoading={actionLoading}
            showRejectForm={showRejectForm}
            rejectionReason={rejectionReason}
            onApprove={handleApprove}
            onReject={handleReject}
            onRejectionReasonChange={setRejectionReason}
            onShowRejectFormChange={setShowRejectForm}
          />
        )}
      </div>
    </div>
  );
}
