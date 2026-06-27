'use client';

import { UserInfoField } from './user-info-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Landmark, User, Hash, CreditCard, CheckCircle } from 'lucide-react';

interface OrganizerProfileSectionProps {
  profile: Record<string, unknown>;
}

export function OrganizerProfileSection({ profile }: OrganizerProfileSectionProps) {
  const fields = [
    { label: 'Business Name', value: String(profile['businessName'] ?? '—'), icon: Building2 },
    { label: 'Bank', value: String(profile['bankName'] ?? '—'), icon: Landmark },
    { label: 'Account Name', value: String(profile['bankAccountName'] ?? '—'), icon: User },
    { label: 'Account Number', value: String(profile['bankAccountNumber'] ?? '—'), icon: Hash },
    {
      label: 'Paystack Subaccount',
      value: String(profile['paystackSubaccountCode'] ?? '—'),
      icon: CreditCard,
    },
    { label: 'Profile Status', value: String(profile['status'] ?? '—'), icon: CheckCircle },
  ];

  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary heading-sm">Organizer Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.label} className="flex items-start gap-3">
              <field.icon className="h-4 w-4 text-text-muted mt-0.5" />
              <div className="flex-1">
                <UserInfoField label={field.label} value={field.value} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
