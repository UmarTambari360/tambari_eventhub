'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, XCircle, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getApplicationDetailAction,
  approveApplicationAction,
  rejectApplicationAction,
} from '@/actions/admin.actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate } from '@/lib/utils';
import type { OrganizerApplicationDTO } from '@eventhub/types';

export default function ApplicationDetailPage() {
  const auth = useAuth();
  const accessToken = auth?.accessToken;
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [application, setApplication] = useState<OrganizerApplicationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !id) return;

    void (async () => {
      const result = await getApplicationDetailAction(id, accessToken);
      if (result.success && result.data) {
        setApplication(result.data);
      }
      setLoading(false);
    })();
  }, [accessToken, id]);

  const handleApprove = async () => {
    if (!accessToken || !id) return;
    setActionLoading('approve');
    setActionError(null);

    const result = await approveApplicationAction(id, accessToken);

    if (result.success) {
      router.push('/admin/applications?status=approved');
    } else {
      setActionError(result.error ?? 'Failed to approve application');
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!accessToken || !id || !rejectionReason.trim()) return;
    setActionLoading('reject');
    setActionError(null);

    const result = await rejectApplicationAction(id, rejectionReason, accessToken);

    if (result.success) {
      router.push('/admin/applications?status=rejected');
    } else {
      setActionError(result.error ?? 'Failed to reject application');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Application not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-violet-600 hover:text-violet-800"
        >
          ← Back to applications
        </button>
      </div>
    );
  }

  const isPending = application.status === 'pending';

  return (
    <div className="max-w-3xl">
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to applications
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{application.businessName}</h1>
          <p className="text-gray-500 mt-1">
            Applied by {application.user.fullName} ({application.user.email})
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Submitted {formatDate(application.createdAt)}
            {application.reviewedAt && ` · Reviewed ${formatDate(application.reviewedAt)}`}
          </p>
        </div>
        <StatusBadge status={application.status as 'pending' | 'approved' | 'rejected'} />
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {/* Business details */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Business Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Description
              </dt>
              <dd className="text-sm text-gray-700 leading-relaxed">
                {application.businessDescription}
              </dd>
            </div>

            {application.websiteUrl && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Website
                </dt>
                <dd>
                  <a
                    href={application.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-800"
                  >
                    {application.websiteUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
            )}

            {application.instagramHandle && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Instagram
                </dt>
                <dd className="text-sm text-gray-700">{application.instagramHandle}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Bank details */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Bank Account</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Bank
              </dt>
              <dd className="text-sm font-medium text-gray-900">{application.bankName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Account Name
              </dt>
              <dd className="text-sm font-medium text-gray-900">{application.bankAccountName}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-gray-400">
            Account number verified with Paystack at application time.
          </p>
        </div>

        {/* Rejection reason (if rejected) */}
        {application.status === 'rejected' && application.rejectionReason && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-800 mb-2">Rejection Reason</h2>
            <p className="text-sm text-red-700">{application.rejectionReason}</p>
          </div>
        )}

        {/* Action buttons — only show for pending */}
        {isPending && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => void handleApprove()}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'approve' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approve & Create Subaccount
            </button>

            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-6 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejection. This will be sent to the applicant.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none mb-4"
              placeholder="e.g. The business description does not meet our minimum requirements..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleReject()}
                disabled={rejectionReason.trim().length < 10 || actionLoading !== null}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'reject' && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
