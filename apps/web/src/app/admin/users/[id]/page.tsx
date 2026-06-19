'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, CheckCircle, Loader2, ShieldOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getUserDetailAction,
  suspendUserAction,
  unsuspendUserAction,
  type AdminUserRow,
} from '@/actions/admin/users.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate, cn } from '@/lib/utils';

export default function AdminUserDetailPage() {
  const auth = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<{
    user: AdminUserRow;
    profile: unknown;
    orderCount: number;
    eventCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.accessToken || !id) return;
    void (async () => {
      const result = await getUserDetailAction(id, auth.accessToken!);
      if (result.success && result.data) setDetail(result.data);
      setLoading(false);
    })();
  }, [auth?.accessToken, id]);

  async function handleSuspend() {
    if (!auth?.accessToken || !id || suspendReason.trim().length < 10) return;
    setActionLoading(true);
    setError(null);
    const result = await suspendUserAction(id, suspendReason, auth.accessToken);
    if (result.success) {
      setSuccess('User suspended.');
      setDetail((prev) => (prev ? { ...prev, user: { ...prev.user, isSuspended: true } } : prev));
      setShowSuspendForm(false);
    } else {
      setError(result.error ?? 'Failed');
    }
    setActionLoading(false);
  }

  async function handleUnsuspend() {
    if (!auth?.accessToken || !id) return;
    setActionLoading(true);
    setError(null);
    const result = await unsuspendUserAction(id, auth.accessToken);
    if (result.success) {
      setSuccess('User unsuspended.');
      setDetail((prev) => (prev ? { ...prev, user: { ...prev.user, isSuspended: false } } : prev));
    } else {
      setError(result.error ?? 'Failed');
    }
    setActionLoading(false);
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  if (!detail) return <div className="text-center py-16 text-(--text-muted)">User not found.</div>;

  const { user } = detail;
  const profile = detail.profile as Record<string, unknown> | null;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push('/admin/users')}
        className="flex items-center gap-1.5 body-sm text-(--text-muted) hover:text-(--text-primary) mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Users
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="heading-xl text-(--text-primary)">{user.fullName}</h1>
          <p className="body-sm text-(--text-muted)">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'badge',
              user.role === 'admin'
                ? 'badge-primary'
                : user.role === 'organizer'
                  ? 'badge-info'
                  : 'badge-neutral'
            )}
          >
            {user.role}
          </span>
          {user.isSuspended ? (
            <span className="badge badge-danger">Suspended</span>
          ) : (
            <span className="badge badge-success">Active</span>
          )}
        </div>
      </div>

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Account info */}
        <div className="card p-5">
          <h2 className="heading-sm text-(--text-primary) mb-4">Account</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoField label="Member Since" value={formatDate(user.createdAt)} />
            <InfoField label="Orders" value={String(detail.orderCount)} />
            {user.role === 'organizer' && (
              <InfoField label="Events Created" value={String(detail.eventCount)} />
            )}
            {user.isSuspended && user.suspendedAt && (
              <InfoField label="Suspended At" value={formatDate(user.suspendedAt)} />
            )}
            {user.isSuspended && user.suspendedReason && (
              <InfoField label="Suspension Reason" value={user.suspendedReason} />
            )}
          </div>
        </div>

        {/* Organizer profile */}
        {profile && (
          <div className="card p-5">
            <h2 className="heading-sm text-(--text-primary) mb-4">Organizer Profile</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="Business Name" value={String(profile['businessName'] ?? '—')} />
              <InfoField label="Bank" value={String(profile['bankName'] ?? '—')} />
              <InfoField label="Account Name" value={String(profile['bankAccountName'] ?? '—')} />
              <InfoField
                label="Account Number"
                value={String(profile['bankAccountNumber'] ?? '—')}
              />
              <InfoField
                label="Paystack Subaccount"
                value={String(profile['paystackSubaccountCode'] ?? '—')}
              />
              <InfoField label="Profile Status" value={String(profile['status'] ?? '—')} />
            </div>
          </div>
        )}

        {/* Suspension controls — not for own account */}
        {user.id !== auth?.user?.id && user.role !== 'admin' && (
          <div className="card p-5">
            <h2 className="heading-sm text-(--text-primary) mb-4">Account Actions</h2>
            {user.isSuspended ? (
              <button
                onClick={() => void handleUnsuspend()}
                disabled={actionLoading}
                className="flex items-center gap-2 btn btn-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Unsuspend User
              </button>
            ) : !showSuspendForm ? (
              <button
                onClick={() => setShowSuspendForm(true)}
                className="flex items-center gap-2 btn btn-md btn-danger"
              >
                <ShieldOff className="h-4 w-4" />
                Suspend User
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label-text">
                    Suspension Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    rows={3}
                    className="input-base resize-none"
                    placeholder="Minimum 10 characters. This may be sent to the user."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => void handleSuspend()}
                    disabled={actionLoading || suspendReason.trim().length < 10}
                    className="flex items-center gap-2 btn btn-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm Suspension
                  </button>
                  <button
                    onClick={() => {
                      setShowSuspendForm(false);
                      setSuspendReason('');
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

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="caption text-(--text-muted) mb-0.5">{label}</p>
      <p className="body-sm text-(--text-primary) font-medium">{value}</p>
    </div>
  );
}
