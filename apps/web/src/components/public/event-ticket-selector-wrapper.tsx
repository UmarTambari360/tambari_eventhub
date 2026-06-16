'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { TicketSelector } from './ticket-selector';
import { createOrderAction } from '@/actions/order.actions';
import type { EventDTO } from '@eventhub/types';
import { toast } from 'sonner';

interface Props {
  event: EventDTO;
}

export function EventTicketSelectorWrapper({ event }: Props) {
  const router = useRouter();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleProceed(selections: Array<{ ticketTypeId: string; quantity: number }>) {
    if (!auth?.user) {
      const next = `/events/${event.slug}`;
      router.push(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }

    if (!auth.accessToken) return;

    setLoading(true);

    const result = await createOrderAction(
      {
        eventId: event.id,
        items: selections,
      },
      auth.accessToken
    );

    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? 'Failed to create order. Please try again.');
      return;
    }

    const { orderId, orderNumber, isFreeOrder } = result.data;

    if (isFreeOrder) {
      // Free orders are immediately completed — go straight to confirmation
      router.push(`/orders/${orderNumber}`);
    } else {
      // Paid orders go to checkout for attendee details + Paystack redirect
      router.push(`/checkout/${orderId}`);
    }
  }

  return (
    <TicketSelector
      ticketTypes={event.ticketTypes}
      onProceed={(selections) => void handleProceed(selections)}
      isLoading={loading}
    />
  );
}
