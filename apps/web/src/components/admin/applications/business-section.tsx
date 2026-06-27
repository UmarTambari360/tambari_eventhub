'use client';

import { Building2, Globe, Instagram } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplicationField } from './application-field';
import type { OrganizerApplicationDTO } from '@eventhub/types';

interface BusinessSectionProps {
  application: OrganizerApplicationDTO;
}

export function BusinessSection({ application }: BusinessSectionProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary heading-sm">Business Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Building2 className="h-4 w-4 text-text-muted mt-1" />
            <div className="flex-1">
              <ApplicationField label="Business Name" value={application.businessName} />
            </div>
          </div>

          <ApplicationField label="Description" value={application.businessDescription} multiline />

          {application.websiteUrl && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-text-muted" />
              <div className="flex-1">
                <ApplicationField label="Website" value={application.websiteUrl} link />
              </div>
            </div>
          )}

          {application.instagramHandle && (
            <div className="flex items-center gap-3">
              <Instagram className="h-4 w-4 text-text-muted" />
              <div className="flex-1">
                <ApplicationField label="Instagram" value={application.instagramHandle} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
