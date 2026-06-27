'use client';

import { formatDate } from '@/lib/utils';
import { UserInfoField } from './user-info-field';
import type { AdminUserRow } from '@/actions/admin/users.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ShoppingBag, CalendarDays, AlertTriangle } from 'lucide-react';

interface AccountInfoSectionProps {
  user: AdminUserRow;
  orderCount: number;
  eventCount: number;
}

export function AccountInfoSection({ user, orderCount, eventCount }: AccountInfoSectionProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary heading-sm">Account</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-text-muted mt-0.5" />
            <div className="flex-1">
              <UserInfoField label="Member Since" value={formatDate(user.createdAt)} />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShoppingBag className="h-4 w-4 text-text-muted mt-0.5" />
            <div className="flex-1">
              <UserInfoField label="Orders" value={String(orderCount)} />
            </div>
          </div>

          {user.role === 'organizer' && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <CalendarDays className="h-4 w-4 text-text-muted mt-0.5" />
              <div className="flex-1">
                <UserInfoField label="Events Created" value={String(eventCount)} />
              </div>
            </div>
          )}

          {user.isSuspended && user.suspendedAt && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <AlertTriangle className="h-4 w-4 text-danger mt-0.5" />
              <div className="flex-1">
                <UserInfoField label="Suspended At" value={formatDate(user.suspendedAt)} />
              </div>
            </div>
          )}

          {user.isSuspended && user.suspendedReason && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <AlertTriangle className="h-4 w-4 text-danger mt-0.5" />
              <div className="flex-1">
                <UserInfoField label="Suspension Reason" value={user.suspendedReason} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
