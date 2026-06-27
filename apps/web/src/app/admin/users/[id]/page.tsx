'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getUserDetailAction,
  suspendUserAction,
  unsuspendUserAction,
  type AdminUserRow,
} from '@/actions/admin/users.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AccountInfoSection } from '@/components/admin/users/account-info-section';
import { OrganizerProfileSection } from '@/components/admin/users/organizer-profile-section';
import { AccountActionsSection } from '@/components/admin/users/account-actions-section';

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
      setSuccess('User suspended successfully.');
      setDetail((prev) => (prev ? { ...prev, user: { ...prev.user, isSuspended: true } } : prev));
      setShowSuspendForm(false);
      setSuspendReason('');
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError(result.error ?? 'Failed to suspend user');
    }
    setActionLoading(false);
  }

  async function handleUnsuspend() {
    if (!auth?.accessToken || !id) return;
    setActionLoading(true);
    setError(null);
    const result = await unsuspendUserAction(id, auth.accessToken);
    if (result.success) {
      setSuccess('User unsuspended successfully.');
      setDetail((prev) => (prev ? { ...prev, user: { ...prev.user, isSuspended: false } } : prev));
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError(result.error ?? 'Failed to unsuspend user');
    }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-text-secondary text-sm">User not found.</p>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/users')}
          className="border-border text-text-secondary hover:bg-surface-raised"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  const { user } = detail;
  const profile = detail.profile as Record<string, unknown> | null;

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, string> = {
      admin: 'bg-primary-100 text-primary-700 border-primary-200',
      organizer: 'bg-info-light text-info border-info-200',
      attendee: 'bg-surface-raised text-text-secondary border-border',
    };
    return variants[role] || variants.attendee;
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/admin/users')}
        className="text-text-muted hover:text-text-primary -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Users
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="heading-xl text-text-primary">{user.fullName}</h1>
          <p className="text-text-secondary text-sm">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'font-medium text-xs px-2.5 py-0.5 border',
              getRoleBadgeVariant(user.role)
            )}
          >
            {user.role}
          </Badge>
          {user.isSuspended ? (
            <Badge variant="destructive" className="font-medium text-xs px-2.5 py-0.5">
              Suspended
            </Badge>
          ) : (
            <Badge className="bg-success-light text-success border-success-200 font-medium text-xs px-2.5 py-0.5 border">
              Active
            </Badge>
          )}
        </div>
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

      {/* Account Information */}
      <AccountInfoSection
        user={user}
        orderCount={detail.orderCount}
        eventCount={detail.eventCount}
      />

      {/* Organizer Profile */}
      {profile && <OrganizerProfileSection profile={profile} />}

      {/* Account Actions */}
      {user.id !== auth?.user?.id && user.role !== 'admin' && (
        <AccountActionsSection
          user={user}
          isSuspended={user.isSuspended}
          actionLoading={actionLoading}
          showSuspendForm={showSuspendForm}
          suspendReason={suspendReason}
          onSuspend={handleSuspend}
          onUnsuspend={handleUnsuspend}
          onSuspendReasonChange={setSuspendReason}
          onShowSuspendFormChange={setShowSuspendForm}
        />
      )}
    </div>
  );
}
