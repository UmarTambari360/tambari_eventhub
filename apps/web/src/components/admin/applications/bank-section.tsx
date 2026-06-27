'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplicationField } from './application-field';
import type { OrganizerApplicationDTO } from '@eventhub/types';

interface BankSectionProps {
  application: OrganizerApplicationDTO;
}

export function BankSection({ application }: BankSectionProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary heading-sm">Bank Account</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ApplicationField label="Bank" value={application.bankName ?? '—'} />
          <ApplicationField label="Account Name" value={application.bankAccountName} />
        </div>
      </CardContent>
    </Card>
  );
}
