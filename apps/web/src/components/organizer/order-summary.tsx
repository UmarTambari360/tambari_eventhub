'use client';

import { formatNaira } from '@/lib/utils';
import type { OrderDTO } from '@eventhub/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface OrderSummaryProps {
  order: OrderDTO;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader className="pb-3">
        <CardTitle className="text-text-muted overline text-xs tracking-wider">Tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Ticket Items */}
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">
                {item.ticketTypeName} × {item.quantity}
              </span>
              <span className="font-medium text-text-primary">
                {item.pricePerTicket === 0 ? 'FREE' : formatNaira(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Service Fee */}
        {order.serviceFee > 0 && (
          <div className="flex justify-between text-sm text-text-muted">
            <span>Service fee</span>
            <span>{formatNaira(order.serviceFee)}</span>
          </div>
        )}

        <Separator className="border-border" />

        {/* Total */}
        <div className="flex justify-between font-bold">
          <span className="text-text-primary">Total</span>
          <span className="text-primary-600">
            {order.isFreeOrder ? 'FREE' : formatNaira(order.totalAmount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
