import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrderStatus } from '@eventhub/types';

interface OrderActionsProps {
  status: OrderStatus;
  eventSlug: string;
  isPaystackReturn: boolean;
  onVerify: () => void;
  isVerifying: boolean;
}

export function OrderActions({
  status,
  eventSlug,
  isPaystackReturn,
  onVerify,
  isVerifying,
}: OrderActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {status === 'paid' && (
        <Button asChild variant="outline" className="border-border text-text-secondary">
          <Link href={`/events/${eventSlug}`}>View Event</Link>
        </Button>
      )}

      {(status === 'processing' || status === 'pending') && isPaystackReturn && (
        <Button
          onClick={onVerify}
          disabled={isVerifying}
          variant="outline"
          className="border-border text-text-secondary"
        >
          {isVerifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Verify Payment
        </Button>
      )}

      <Button asChild className="btn-primary">
        <Link href="/my-tickets">My Tickets</Link>
      </Button>
    </div>
  );
}
