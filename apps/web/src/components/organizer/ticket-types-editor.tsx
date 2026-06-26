'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { OrganizerEventDTO } from '@eventhub/types';
import type { UpdateTicketTypeInput } from '@eventhub/validators';
import { TicketTypeRow } from './ticket-type-row';
import { AddTicketTypeRow } from './add-ticket-type';
import { Card, CardContent } from '@/components/ui/card';

interface TicketTypesEditorProps {
  event: OrganizerEventDTO;
  accessToken: string;
  onRefresh: () => void;
  setError: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
}

export function TicketTypesEditor({
  event,
  onRefresh,
  setError,
  setSuccessMsg,
}: TicketTypesEditorProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const ticketTypes = event.ticketTypes ?? [];

  async function handleUpdate(ticketTypeId: string, data: UpdateTicketTypeInput) {
    setSaving(ticketTypeId);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiClient.patch(`/events/ticket-types/${ticketTypeId}`, data);
      setSuccessMsg('Ticket type updated.');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket type');
    }
    setSaving(null);
  }

  async function handleDelete(ticketTypeId: string) {
    if (!confirm('Delete this ticket type? This cannot be undone.')) return;
    setDeleting(ticketTypeId);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiClient.delete(`/events/ticket-types/${ticketTypeId}`);
      setSuccessMsg('Ticket type deleted.');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ticket type');
    }
    setDeleting(null);
  }

  if (event.isCancelled) {
    return (
      <Card className="p-8 text-center border-border">
        <CardContent className="pt-6">
          <p className="body-sm text-text-muted">
            Ticket types cannot be edited for cancelled events.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {ticketTypes.length === 0 && (
        <Card className="border-dashed border-2 border-border p-8 text-center">
          <CardContent className="pt-6">
            <p className="body-sm text-text-muted">No ticket types yet. Create your first one.</p>
          </CardContent>
        </Card>
      )}

      {ticketTypes.map((tt) => (
        <TicketTypeRow
          key={tt.id}
          ticketType={tt}
          isExpanded={expanded === tt.id}
          onToggle={() => setExpanded(expanded === tt.id ? null : tt.id)}
          onSave={(data) => void handleUpdate(tt.id, data)}
          onDelete={() => void handleDelete(tt.id)}
          isSaving={saving === tt.id}
          isDeleting={deleting === tt.id}
        />
      ))}

      {ticketTypes.length < 10 && (
        <AddTicketTypeRow
          eventId={event.id}
          onAdded={() => {
            setSuccessMsg('Ticket type added.');
            onRefresh();
          }}
          setError={setError}
        />
      )}
    </div>
  );
}
