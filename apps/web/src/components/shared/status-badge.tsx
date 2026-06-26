import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Status =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'processing'
  | 'active'
  | 'inactive';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  suspended: { label: 'Suspended', variant: 'secondary' },
  paid: { label: 'Paid', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
  refunded: { label: 'Refunded', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'default' },
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  // Map variant to actual classes

  return (
    <Badge 
      variant={config.variant === 'success' || config.variant === 'warning' ? 'default' : config.variant}
      className={cn(
        'shrink-0',
        config.variant === 'success' && 'bg-success text-white hover:bg-success/90 border-success',
        config.variant === 'warning' && 'bg-warning text-white hover:bg-warning/90 border-warning',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}