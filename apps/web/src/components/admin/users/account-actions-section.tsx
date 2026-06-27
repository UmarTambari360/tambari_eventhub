'use client';

import { ShieldOff, ShieldCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AdminUserRow } from '@/actions/admin/users.actions';

interface AccountActionsSectionProps {
  user: AdminUserRow;
  isSuspended: boolean;
  actionLoading: boolean;
  showSuspendForm: boolean;
  suspendReason: string;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onSuspendReasonChange: (value: string) => void;
  onShowSuspendFormChange: (value: boolean) => void;
}

export function AccountActionsSection({
  isSuspended,
  actionLoading,
  showSuspendForm,
  suspendReason,
  onSuspend,
  onUnsuspend,
  onSuspendReasonChange,
  onShowSuspendFormChange,
}: AccountActionsSectionProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary heading-sm">Account Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {isSuspended ? (
          <Button
            onClick={onUnsuspend}
            disabled={actionLoading}
            className="bg-success hover:bg-success/90 text-white"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            Unsuspend User
          </Button>
        ) : !showSuspendForm ? (
          <Button onClick={() => onShowSuspendFormChange(true)} variant="destructive">
            <ShieldOff className="h-4 w-4 mr-2" />
            Suspend User
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspendReason" className="text-text-primary">
                Suspension Reason <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="suspendReason"
                value={suspendReason}
                onChange={(e) => onSuspendReasonChange(e.target.value)}
                rows={3}
                className="border-border bg-surface text-text-primary resize-none focus:ring-primary-500"
                placeholder="Minimum 10 characters. This may be sent to the user."
              />
              {suspendReason.trim().length > 0 && suspendReason.trim().length < 10 && (
                <p className="text-danger text-xs">
                  Please provide at least 10 characters for the suspension reason.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={onSuspend}
                disabled={actionLoading || suspendReason.trim().length < 10}
                variant="destructive"
              >
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Suspension
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onShowSuspendFormChange(false);
                  onSuspendReasonChange('');
                }}
                className="border-border text-text-secondary hover:bg-surface-raised"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
