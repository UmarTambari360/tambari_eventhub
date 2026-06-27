// app/dashboard/orders/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getOrderAction } from '@/actions/order.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate } from '@/lib/utils';
import type { OrderDTO, OrderStatus } from '@eventhub/types';

// Shadcn UI imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import extracted components
import { AttendeeList } from '@/components/organizer/attendee-list';
import { OrderSummary } from '@/components/organizer/order-summary';

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
        <p className="text-text-secondary text-sm mb-4">Order not found.</p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-border text-text-secondary hover:bg-surface-raised"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/orders')}
        className="text-text-muted hover:text-text-primary -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to orders
      </Button>

      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="heading-xl text-text-primary font-mono">{order.orderNumber}</h1>
          <p className="text-text-secondary text-sm">
            {order.paidAt ? `Paid ${formatDate(order.paidAt)}` : formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status as OrderStatus} />
      </div>

      {/* Event Information */}
      <Card className="border-border bg-surface-overlay">
        <CardHeader className="pb-3">
          <CardTitle className="text-text-muted overline text-xs tracking-wider">Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            href={`/events/${order.event.slug}`}
            className="heading-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors inline-block"
          >
            {order.event.title}
          </Link>
          <div className="flex flex-wrap gap-4 text-text-secondary text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-text-muted" />
              {formatDate(order.event.eventDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-text-muted" />
              {order.event.venue}, {order.event.location}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card className="border-border bg-surface-overlay">
        <CardHeader className="pb-3">
          <CardTitle className="text-text-muted overline text-xs tracking-wider">
            Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="heading-sm text-text-primary">{order.customerName}</p>
          <p className="text-text-secondary text-sm">{order.customerEmail}</p>
          {order.customerPhone && (
            <p className="text-text-secondary text-sm">{order.customerPhone}</p>
          )}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <OrderSummary order={order} />

      {/* Attendees */}
      {order.attendees.length > 0 && <AttendeeList attendees={order.attendees} />}
    </div>
  );
}
