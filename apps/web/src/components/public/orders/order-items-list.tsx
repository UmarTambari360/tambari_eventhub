import { formatNaira } from '@/lib/utils';
import type { OrderDTO } from '@eventhub/types';

interface OrderItemsListProps {
  items: OrderDTO['items'];
  serviceFee: number;
  totalAmount: number;
  isFreeOrder: boolean;
}

export function OrderItemsList({
  items,
  serviceFee,
  totalAmount,
  isFreeOrder,
}: OrderItemsListProps) {
  return (
    <div className="space-y-2">
      <p className="caption text-text-muted uppercase tracking-wide">Tickets</p>
      {items.map((item) => (
        <div key={item.id} className="flex justify-between body-sm">
          <span className="text-text-secondary">
            {item.ticketTypeName} × {item.quantity}
          </span>
          <span className="font-medium text-text-primary">
            {item.pricePerTicket === 0 ? 'FREE' : formatNaira(item.subtotal)}
          </span>
        </div>
      ))}
      {serviceFee > 0 && (
        <div className="flex justify-between body-sm text-text-muted">
          <span>Service fee</span>
          <span>{formatNaira(serviceFee)}</span>
        </div>
      )}
      <div className="border-t border-border pt-2 flex justify-between font-bold">
        <span className="text-text-primary">Total</span>
        <span className="text-brand">{isFreeOrder ? 'FREE' : formatNaira(totalAmount)}</span>
      </div>
    </div>
  );
}
