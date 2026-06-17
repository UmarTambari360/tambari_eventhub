'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getOrderAction } from '@/actions/order.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate, formatNaira, cn } from '@/lib/utils';
import type { OrderDTO, OrderStatus } from '@eventhub/types';

export default function OrganizerOrderDetailPage() {
  const auth = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.accessToken || !id) return;
    void (async () => {
      // id here is orderNumber
      const result = await getOrderAction(id, auth.accessToken!);
      if (result.success && result.data) {
        setOrder(result.data);
      }
      setLoading(false);
    })();
  }, [auth?.accessToken, id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="body-sm text-(--text-muted) mb-3">Order not found.</p>
        <button onClick={() => router.back()} className="btn btn-ghost btn-md">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push('/dashboard/orders')}
        className="flex items-center gap-1.5 body-sm text-(--text-muted) hover:text-(--text-primary) mb-5 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </button>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="heading-xl text-(--text-primary) font-mono">{order.orderNumber}</h1>
          <p className="body-sm text-(--text-muted) mt-0.5">
            {order.paidAt ? `Paid ${formatDate(order.paidAt)}` : formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status as OrderStatus} />
      </div>

      {/* Event info */}
      <div className="card p-5 mb-4">
        <p className="overline text-(--text-muted) mb-3">Event</p>
        <Link
          href={`/events/${order.event.slug}`}
          className="heading-sm text-(--primary) hover:underline"
        >
          {order.event.title}
        </Link>
        <div className="mt-2 flex flex-wrap gap-3 body-sm text-(--text-muted)">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(order.event.eventDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {order.event.venue}, {order.event.location}
          </span>
        </div>
      </div>

      {/* Customer info */}
      <div className="card p-5 mb-4">
        <p className="overline text-(--text-muted) mb-3">Customer</p>
        <p className="heading-sm text-(--text-primary)">{order.customerName}</p>
        <p className="body-sm text-(--text-muted)">{order.customerEmail}</p>
        {order.customerPhone && (
          <p className="body-sm text-(--text-muted)">{order.customerPhone}</p>
        )}
      </div>

      {/* Order items */}
      <div className="card p-5 mb-4">
        <p className="overline text-(--text-muted) mb-3">Tickets</p>
        <div className="space-y-2">
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
      </div>

      {/* Attendees */}
      {order.attendees.length > 0 && (
        <div className="card p-5">
          <p className="overline text-(--text-muted) mb-3">Attendees ({order.attendees.length})</p>
          <div className="space-y-3">
            {order.attendees.map((attendee) => (
              <div
                key={attendee.id}
                className={cn(
                  'rounded-xl border p-4 flex items-center justify-between gap-4',
                  attendee.isRevoked ? 'border-red-200 bg-red-50 opacity-60' : 'border-(--border)'
                )}
              >
                <div className="min-w-0">
                  <p className="heading-sm text-(--text-primary)">
                    {attendee.firstName} {attendee.lastName}
                  </p>
                  <p className="caption text-(--text-muted)">{attendee.ticketTypeName}</p>
                  <p className="caption font-mono text-(--text-muted) mt-0.5">
                    {attendee.ticketCode}
                  </p>
                  {attendee.isCheckedIn && (
                    <p className="caption text-(--success) mt-0.5">
                      ✓ Checked in {attendee.checkedInAt ? formatDate(attendee.checkedInAt) : ''}
                    </p>
                  )}
                  {attendee.isRevoked && <p className="caption text-(--danger) mt-0.5">Revoked</p>}
                </div>
                {attendee.qrCodeUrl && (
                  <a
                    href={attendee.qrCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <img src={attendee.qrCodeUrl} alt="QR" className="h-14 w-14 rounded-lg" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
