import type { OrderDTO } from '@eventhub/types';

interface CheckoutHeaderProps {
  order: OrderDTO;
}

export function CheckoutHeader({ order }: CheckoutHeaderProps) {
  const totalAttendees = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mb-6">
      <h1 className="heading-xl text-text-primary">Checkout</h1>
      <p className="body-sm text-text-muted mt-1">
        {order.event.title} · {totalAttendees} ticket{totalAttendees !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
