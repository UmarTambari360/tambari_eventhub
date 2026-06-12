'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { TicketSelector } from './ticket-selector';
import type { EventDTO } from '@eventhub/types';

interface Props {
  event: EventDTO;
}

export function EventTicketSelectorWrapper({ event }: Props) {
  const router = useRouter();
  const auth = useAuth();

  function handleProceed(selections: Array<{ ticketTypeId: string; quantity: number }>) {
    if (!auth?.user) {
      const next = `/events/${event.slug}`;
      router.push(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }

    // PHASE 7: createOrder Server Action → redirect to /checkout/[orderId]
    // For now, encode selections in query params as a placeholder
    const params = new URLSearchParams();
    params.set('eventId', event.id);
    selections.forEach((s) => {
      params.append('t', `${s.ticketTypeId}:${s.quantity}`);
    });

    // This route is built in Phase 7
    router.push(`/checkout/new?${params.toString()}`);
  }

  return <TicketSelector ticketTypes={event.ticketTypes} onProceed={handleProceed} />;
}
