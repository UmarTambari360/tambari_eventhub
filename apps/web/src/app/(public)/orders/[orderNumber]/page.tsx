'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getOrderAction, verifyPaymentAction } from '@/actions/order.actions';
import { usePoll } from '@/hooks/use-poll';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { OrderDTO } from '@eventhub/types';
import { OrderStatusBanner } from '@/components/public/orders/order-status-banner';
import { OrderStatusBadge } from '@/components/public/orders/order-status-badge';
import { OrderEventInfo } from '@/components/public/orders/order-event-info';
import { OrderItemsList } from '@/components/public/orders/order-items-list';
import { AttendeeTicket } from '@/components/public/orders/attendee-ticket';
import { OrderActions } from '@/components/public/orders/order-actions';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const searchParams = useSearchParams();
  const auth = useAuth();

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const ref = searchParams.get('ref');
  const isPaystackReturn = !!ref;

  const fetchOrder = useCallback(async (): Promise<OrderDTO | null> => {
    if (!auth?.accessToken) return null;
    const result = await getOrderAction(orderNumber, auth.accessToken);
    if (result.success && result.data) {
      setOrder(result.data);
      return result.data;
    }
    return null;
  }, [auth?.accessToken, orderNumber]);

  useEffect(() => {
    void (async () => {
      await fetchOrder();
      setLoading(false);
    })();
  }, [fetchOrder]);

  const isPollable =
    isPaystackReturn && (order?.status === 'pending' || order?.status === 'processing');

  usePoll(
    async () => {
      const updated = await fetchOrder();
      return (
        updated?.status === 'paid' ||
        updated?.status === 'failed' ||
        updated?.status === 'cancelled' ||
        updated?.status === 'refunded'
      );
    },
    {
      interval: 5_000,
      maxAttempts: 24,
      enabled: !!isPollable,
      onTimeout: () => {
        setVerifyMessage(
          'Payment confirmation is taking longer than expected. Use the "Verify Payment" button below.'
        );
      },
    }
  );

  const handleManualVerify = async () => {
    if (!auth?.accessToken) return;
    setVerifying(true);
    setVerifyMessage(null);

    const result = await verifyPaymentAction(orderNumber, auth.accessToken);

    if (result.success) {
      await fetchOrder();
      setVerifyMessage(result.data?.message ?? 'Verification complete.');
    } else {
      setVerifyMessage(result.error ?? 'Verification failed. Please try again.');
    }
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md w-full text-center border-border">
          <CardContent className="pt-6">
            <p className="heading-lg text-text-primary mb-2">Order not found</p>
            <Button asChild className="btn-primary">
              <Link href="/events">Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-raised py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <OrderStatusBanner status={order.status} isFreeOrder={order.isFreeOrder} />

        {isPollable && order.status !== 'paid' && (
          <Alert className="mb-5 border-info/20 bg-info-light text-info">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Waiting for payment confirmation…</AlertDescription>
          </Alert>
        )}

        {verifyMessage && (
          <Alert className="mb-5 border-warning/20 bg-warning-light text-warning">
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>{verifyMessage}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border mb-4">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <p className="overline text-text-muted">Order number</p>
              <p className="heading-md text-text-primary font-mono">{order.orderNumber}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </CardHeader>

          <CardContent className="space-y-5">
            <OrderEventInfo event={order.event} />

            <OrderItemsList
              items={order.items}
              serviceFee={order.serviceFee}
              totalAmount={order.totalAmount}
              isFreeOrder={order.isFreeOrder}
            />

            {order.status === 'paid' && order.attendees.length > 0 && (
              <div className="space-y-3">
                <p className="caption text-text-muted uppercase tracking-wide">Your Tickets</p>
                {order.attendees.map((attendee) => (
                  <AttendeeTicket key={attendee.id} attendee={attendee} />
                ))}
                <p className="caption text-text-muted">
                  Your tickets will also be delivered to {order.customerEmail}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <OrderActions
          status={order.status}
          eventSlug={order.event.slug}
          isPaystackReturn={isPaystackReturn}
          onVerify={handleManualVerify}
          isVerifying={verifying}
        />
      </div>
    </div>
  );
}
