'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Calendar,
  MapPin,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getOrderAction, verifyPaymentAction } from '@/actions/order.actions';
import { usePoll } from '@/hooks/use-poll';
import { formatNaira, formatDate, cn } from '@/lib/utils';
import type { OrderDTO, OrderStatus } from '@eventhub/types';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const searchParams = useSearchParams();
  const auth = useAuth();

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  // Paystack redirects back with a `ref` param
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

  // Initial load
  useEffect(() => {
    void (async () => {
      await fetchOrder();
      setLoading(false);
    })();
  }, [fetchOrder]);

  // Poll for status if pending/processing (Paystack return)
  const isPollable =
    isPaystackReturn && (order?.status === 'pending' || order?.status === 'processing');

  usePoll(
    async () => {
      const updated = await fetchOrder();
      // Stop polling when paid or terminal state
      return (
        updated?.status === 'paid' ||
        updated?.status === 'failed' ||
        updated?.status === 'cancelled' ||
        updated?.status === 'refunded'
      );
    },
    {
      interval: 5_000,
      maxAttempts: 24, // 2 minutes
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
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="heading-lg text-(--text-primary) mb-2">Order not found</p>
          <Link href="/events" className="btn btn-primary btn-md">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface-raised) py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Status banner */}
        <StatusBanner status={order.status} isFreeOrder={order.isFreeOrder} />

        {/* Polling indicator */}
        {isPollable && order.status !== 'paid' && (
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Waiting for payment confirmation…
          </div>
        )}

        {/* Verify message */}
        {verifyMessage && (
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <RefreshCw className="h-4 w-4 shrink-0" />
            {verifyMessage}
          </div>
        )}

        {/* Order card */}
        <div className="card p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="overline text-(--text-muted)">Order number</p>
              <p className="heading-md text-(--text-primary) font-mono">{order.orderNumber}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Event info */}
          <div className="rounded-xl bg-(--surface-raised) p-4 mb-5">
            <p className="heading-sm text-(--text-primary)">{order.event.title}</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 body-sm text-(--text-muted)">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                {formatDate(order.event.eventDate, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <div className="flex items-center gap-1.5 body-sm text-(--text-muted)">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                {order.event.venue}, {order.event.location}
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="space-y-2 mb-5">
            <p className="caption text-(--text-muted) uppercase tracking-wide">Tickets</p>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between body-sm">
                <span className="text-(--text-secondary)">
                  {item.ticketTypeName} × {item.quantity}
                </span>
                <span className="font-medium text-(--text-primary)">
                  {item.pricePerTicket === 0 ? 'FREE' : formatNaira(item.subtotal)}
                </span>
              </div>
            ))}
            {order.serviceFee > 0 && (
              <div className="flex justify-between body-sm text-(--text-muted)">
                <span>Service fee</span>
                <span>{formatNaira(order.serviceFee)}</span>
              </div>
            )}
            <div className="border-t border-(--border) pt-2 flex justify-between font-bold">
              <span className="text-(--text-primary)">Total</span>
              <span className="text-(--primary)">
                {order.isFreeOrder ? 'FREE' : formatNaira(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Attendees with QR codes */}
          {order.status === 'paid' && order.attendees.length > 0 && (
            <div className="space-y-3">
              <p className="caption text-(--text-muted) uppercase tracking-wide">Your Tickets</p>
              {order.attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className={cn(
                    'rounded-xl border p-4 flex items-center justify-between gap-4',
                    attendee.isRevoked
                      ? 'border-red-200 bg-red-50 opacity-60'
                      : 'border-(--border) bg-(--surface-raised)'
                  )}
                >
                  <div className="min-w-0">
                    <p className="body-sm font-semibold text-(--text-primary) truncate">
                      {attendee.firstName} {attendee.lastName}
                    </p>
                    <p className="caption text-(--text-muted)">{attendee.ticketTypeName}</p>
                    <p className="caption font-mono text-(--text-muted) mt-0.5">
                      {attendee.ticketCode}
                    </p>
                    {attendee.isRevoked && <p className="caption text-red-500 mt-0.5">Revoked</p>}
                  </div>
                  {attendee.qrCodeUrl ? (
                    <img
                      src={attendee.qrCodeUrl}
                      alt={`QR code for ${attendee.ticketCode}`}
                      className="h-16 w-16 rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-(--surface-sunken) flex items-center justify-center shrink-0">
                      <QrCode className="h-6 w-6 text-(--text-muted)" />
                    </div>
                  )}
                </div>
              ))}
              <p className="caption text-(--text-muted)">
                Your tickets will also be delivered to {order.customerEmail}.
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {order.status === 'paid' && (
            <Link href={`/events/${order.event.slug}`} className="btn btn-ghost btn-md">
              View Event
            </Link>
          )}

          {(order.status === 'processing' || order.status === 'pending') && isPaystackReturn && (
            <button
              onClick={() => void handleManualVerify()}
              disabled={verifying}
              className="btn btn-ghost btn-md"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Verify Payment
            </button>
          )}

          <Link href="/my-tickets" className="btn btn-primary btn-md">
            My Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBanner({ status, isFreeOrder }: { status: OrderStatus; isFreeOrder: boolean }) {
  if (status === 'paid') {
    return (
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-green-50 border border-green-200 px-6 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="heading-sm text-green-800">
            {isFreeOrder ? 'Registration Confirmed!' : 'Payment Successful!'}
          </p>
          <p className="body-sm text-green-700 mt-0.5">
            {isFreeOrder
              ? 'Your free tickets have been confirmed. Check your email for details.'
              : 'Your tickets are confirmed. Check your email for QR codes.'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'processing' || status === 'pending') {
    return (
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-amber-50 border border-amber-200 px-6 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <p className="heading-sm text-amber-800">Payment Pending</p>
          <p className="body-sm text-amber-700 mt-0.5">
            We're confirming your payment. This usually takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'failed' || status === 'cancelled') {
    return (
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-red-50 border border-red-200 px-6 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <p className="heading-sm text-red-800">
            {status === 'failed' ? 'Payment Failed' : 'Order Cancelled'}
          </p>
          <p className="body-sm text-red-700 mt-0.5">
            {status === 'failed'
              ? 'Your payment was not successful. No charge was made.'
              : 'This order has been cancelled.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'badge badge-warning' },
    processing: { label: 'Processing', className: 'badge badge-primary' },
    paid: { label: 'Confirmed', className: 'badge badge-success' },
    failed: { label: 'Failed', className: 'badge badge-danger' },
    cancelled: { label: 'Cancelled', className: 'badge badge-neutral' },
    refunded: { label: 'Refunded', className: 'badge badge-info' },
  };
  const { label, className } = config[status];
  return <span className={className}>{label}</span>;
}
