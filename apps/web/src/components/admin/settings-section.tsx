'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsSectionProps {
  title: string;
  description?: string;
  currentValue?: string;
  children: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  currentValue,
  children,
}: SettingsSectionProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary heading-sm">{title}</CardTitle>
        {description && <p className="text-text-secondary text-sm">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        {currentValue && <p className="text-text-muted text-xs">Current: {currentValue}</p>}
      </CardContent>
    </Card>
  );
}
