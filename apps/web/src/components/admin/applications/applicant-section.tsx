'use client';

import { User, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { OrganizerApplicationDTO } from '@eventhub/types';

interface ApplicantSectionProps {
  user: OrganizerApplicationDTO['user'];
}

export function ApplicantSection({ user }: ApplicantSectionProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary heading-sm">Applicant</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-text-muted" />
              <span className="text-text-primary font-medium">{user.fullName}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-text-muted" />
              <span className="text-text-secondary text-sm">{user.email}</span>
            </div>
          </div>
          {user.memberSince && (
            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-text-muted" />
                <span className="text-text-secondary text-sm">
                  Member since {formatDate(user.memberSince)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
