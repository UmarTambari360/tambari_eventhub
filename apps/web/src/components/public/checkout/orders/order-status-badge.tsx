import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@eventhub/types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config: Record<
    OrderStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
  > = {
    pending: { label: 'Pending', variant: 'secondary' },
    processing: { label: 'Processing', variant: 'default' },
    paid: { label: 'Confirmed', variant: 'default' },
    failed: { label: 'Failed', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'outline' },
    refunded: { label: 'Refunded', variant: 'secondary' },
  };

  const { label, variant } = config[status];


  return (
    <Badge
      variant={
        status === 'paid' || status === 'pending' || status === 'processing'
          ? 'default'
          : variant
      }
      className={cn(
        'shrink-0',
        status === 'paid' && 'bg-success text-white hover:bg-success/90 border-success',
        status === 'pending' && 'bg-warning text-white hover:bg-warning/90 border-warning',
        status === 'processing' &&
          'bg-primary-500 text-white hover:bg-primary-600 border-primary-500',
        className
      )}
    >
      {label}
    </Badge>
  );
}
