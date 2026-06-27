'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RejectionReasonProps {
  reason: string;
}

export function RejectionReason({ reason }: RejectionReasonProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <div className="space-y-1">
        <p className="font-semibold text-sm text-danger">Rejection Reason</p>
        <AlertDescription className="text-danger/90">{reason}</AlertDescription>
      </div>
    </Alert>
  );
}
