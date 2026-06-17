'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, QrCode, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkInAttendeeAction, revokeTicketAction } from '@/actions/analytics.actions';
import type { EventAttendee } from '@/actions/analytics.actions';

interface AttendeesTableProps {
  attendees: EventAttendee[];
  eventId: string;
  accessToken: string;
  onRefresh: () => void;
}

export function AttendeesTable({
  attendees,
  eventId,
  accessToken,
  onRefresh,
}: AttendeesTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  async function handleCheckIn(attendee: EventAttendee) {
    setActionLoading(attendee.id);
    setActionError(null);
    setActionSuccess(null);

    const result = await checkInAttendeeAction(attendee.ticketCode, eventId, accessToken);

    if (result.success && result.data) {
      setActionSuccess(result.data.message);
      onRefresh();
    } else {
      setActionError(result.error ?? 'Check-in failed');
    }
    setActionLoading(null);
  }

  async function handleRevoke(attendee: EventAttendee) {
    const reason = window.prompt('Enter reason for revoking this ticket:');
    if (!reason?.trim()) return;

    setActionLoading(attendee.id);
    setActionError(null);
    setActionSuccess(null);

    const result = await revokeTicketAction(attendee.id, reason, accessToken);

    if (result.success) {
      setActionSuccess('Ticket revoked.');
      onRefresh();
    } else {
      setActionError(result.error ?? 'Revoke failed');
    }
    setActionLoading(null);
  }

  if (attendees.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-(--border) py-12 text-center">
        <p className="body-sm text-(--text-muted)">No attendees yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(actionError || actionSuccess) && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-3 text-sm',
            actionError
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          )}
        >
          {actionError ?? actionSuccess}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-(--surface-raised) border-b border-(--border)">
            <tr>
              <th className="px-4 py-3 text-left caption text-(--text-muted)">Attendee</th>
              <th className="px-4 py-3 text-left caption text-(--text-muted) hidden md:table-cell">
                Ticket
              </th>
              <th className="px-4 py-3 text-left caption text-(--text-muted) hidden sm:table-cell">
                Type
              </th>
              <th className="px-4 py-3 text-left caption text-(--text-muted)">Status</th>
              <th className="px-4 py-3 text-right caption text-(--text-muted)">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            {attendees.map((attendee) => (
              <tr
                key={attendee.id}
                className={cn(
                  'hover:bg-(--surface-raised) transition-colors',
                  attendee.isRevoked && 'opacity-50'
                )}
              >
                <td className="px-4 py-3">
                  <p className="heading-sm text-(--text-primary)">
                    {attendee.firstName} {attendee.lastName}
                  </p>
                  <p className="caption text-(--text-muted)">{attendee.email}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="caption font-mono text-(--text-secondary)">{attendee.ticketCode}</p>
                  {attendee.orderNumber && (
                    <p className="caption text-(--text-muted)">{attendee.orderNumber}</p>
                  )}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="badge badge-neutral">{attendee.ticketTypeName ?? '—'}</span>
                </td>
                <td className="px-4 py-3">
                  {attendee.isRevoked ? (
                    <span className="badge badge-danger">Revoked</span>
                  ) : attendee.isCheckedIn ? (
                    <span className="badge badge-success">Checked in</span>
                  ) : (
                    <span className="badge badge-neutral">Not checked in</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {!attendee.isRevoked && !attendee.isCheckedIn && (
                      <button
                        onClick={() => void handleCheckIn(attendee)}
                        disabled={actionLoading === attendee.id}
                        className="flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                        title="Check in"
                      >
                        {actionLoading === attendee.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Check in
                      </button>
                    )}
                    {!attendee.isRevoked && (
                      <button
                        onClick={() => void handleRevoke(attendee)}
                        disabled={actionLoading === attendee.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Revoke ticket"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    {attendee.qrCodeUrl && (
                      <a
                        href={attendee.qrCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                        title="View QR code"
                      >
                        <QrCode className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
