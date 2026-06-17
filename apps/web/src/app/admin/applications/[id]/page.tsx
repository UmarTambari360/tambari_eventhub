'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertCircle, Building2 } from 'lucide-react';
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
      <div className="text-center py-16">
        <p className="text-(--text-muted)">Application not found.</p>
        <button onClick={() => router.back()} className="mt-3 btn btn-ghost btn-sm">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push('/admin/applications')}
        className="flex items-center gap-1.5 body-sm text-(--text-muted) hover:text-(--text-primary) mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Applications
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="heading-xl text-(--text-primary)">{app.businessName}</h1>
          <p className="body-sm text-(--text-muted) mt-0.5">
            Submitted {formatDate(app.createdAt)}
            {app.reviewedAt && ` · Reviewed ${formatDate(app.reviewedAt)}`}
          </p>
        </div>
        <StatusBadge status={app.status as 'pending' | 'approved' | 'rejected'} />
      </div>

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Applicant */}
        <div className="card p-5">
          <h2 className="heading-sm text-(--text-primary) mb-4">Applicant</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Full Name" value={app.user.fullName} />
            <Field label="Email" value={app.user.email} />
            {app.user.memberSince && (
              <Field label="Member Since" value={formatDate(app.user.memberSince)} />
            )}
          </div>
        </div>

        {/* Business Info */}
        <div className="card p-5">
          <h2 className="heading-sm text-(--text-primary) mb-4">Business Information</h2>
          <div className="space-y-4 text-sm">
            <Field label="Business Name" value={app.businessName} />
            <Field label="Description" value={app.businessDescription} multiline />
            {app.websiteUrl && <Field label="Website" value={app.websiteUrl} link />}
            {app.instagramHandle && <Field label="Instagram" value={app.instagramHandle} />}
          </div>
        </div>

        {/* Bank */}
        <div className="card p-5">
          <h2 className="heading-sm text-(--text-primary) mb-4">Bank Account</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Bank" value={app.bankName ?? '—'} />
            <Field label="Account Name" value={app.bankAccountName} />
          </div>
        </div>

        {/* Rejection reason if any */}
        {app.status === 'rejected' && app.rejectionReason && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="caption text-red-600 font-semibold mb-1">Rejection Reason</p>
            <p className="body-sm text-red-700">{app.rejectionReason}</p>
          </div>
        )}

        {/* Actions */}
        {app.status === 'pending' && (
          <div className="card p-5">
            <h2 className="heading-sm text-(--text-primary) mb-4">Review Actions</h2>

            {!showRejectForm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => void handleApprove()}
                  disabled={actionLoading === 'approve'}
                  className="flex items-center gap-2 btn btn-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {actionLoading === 'approve' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Approve Application
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex items-center gap-2 btn btn-ghost btn-md text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label-text">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="input-base resize-none"
                    placeholder="Explain why the application is being rejected (min 10 chars). This will be sent to the applicant."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => void handleReject()}
                    disabled={actionLoading === 'reject' || rejectionReason.trim().length < 10}
                    className="flex items-center gap-2 btn btn-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === 'reject' && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                    }}
                    className="btn btn-ghost btn-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
  link,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  link?: boolean;
}) {
  return (
    <div>
      <p className="caption text-(--text-muted) mb-0.5">{label}</p>
      {multiline ? (
        <p className="body-sm text-(--text-primary) whitespace-pre-wrap">{value}</p>
      ) : link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="body-sm text-(--primary) hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className="body-sm text-(--text-primary) font-medium">{value}</p>
      )}
    </div>
  );
}
