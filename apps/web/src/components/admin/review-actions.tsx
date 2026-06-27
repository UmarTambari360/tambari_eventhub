// app/admin/applications/[id]/components/review-actions.tsx
'use client';

import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReviewActionsProps {
  actionLoading: 'approve' | 'reject' | null;
  showRejectForm: boolean;
  rejectionReason: string;
  onApprove: () => void;
  onReject: () => void;
  onRejectionReasonChange: (value: string) => void;
  onShowRejectFormChange: (value: boolean) => void;
}

export function ReviewActions({
  actionLoading,
  showRejectForm,
  rejectionReason,
  onApprove,
  onReject,
  onRejectionReasonChange,
  onShowRejectFormChange,
}: ReviewActionsProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary heading-sm">Review Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {!showRejectForm ? (
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onApprove}
              disabled={actionLoading === 'approve'}
              className="bg-success hover:bg-success/90 text-white"
            >
              {actionLoading === 'approve' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Application
            </Button>
            <Button
              variant="outline"
              onClick={() => onShowRejectFormChange(true)}
              className="border-danger-200 text-danger hover:bg-danger-50 hover:border-danger-300"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className="text-text-primary">
                Rejection Reason <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => onRejectionReasonChange(e.target.value)}
                rows={4}
                className="border-border bg-surface text-text-primary resize-none focus:ring-primary-500"
                placeholder="Explain why the application is being rejected (min 10 chars). This will be sent to the applicant."
              />
              {rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 && (
                <p className="text-danger text-xs">
                  Please provide at least 10 characters for the rejection reason.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={onReject}
                disabled={actionLoading === 'reject' || rejectionReason.trim().length < 10}
                className="bg-danger hover:bg-danger/90 text-white"
              >
                {actionLoading === 'reject' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Rejection
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onShowRejectFormChange(false);
                  onRejectionReasonChange('');
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
