import { cn } from '@/lib/utils';

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

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'badge badge-warning' },
  approved: { label: 'Approved', className: 'badge badge-success' },
  rejected: { label: 'Rejected', className: 'badge badge-danger' },
  suspended: { label: 'Suspended', className: 'badge badge-neutral' },
  paid: { label: 'Paid', className: 'badge badge-success' },
  failed: { label: 'Failed', className: 'badge badge-danger' },
  cancelled: { label: 'Cancelled', className: 'badge badge-neutral' },
  refunded: { label: 'Refunded', className: 'badge badge-info' },
  processing: { label: 'Processing', className: 'badge badge-primary' },
  active: { label: 'Active', className: 'badge badge-success' },
  inactive: { label: 'Inactive', className: 'badge badge-neutral' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <span className={cn(config.className, className)}>{config.label}</span>;
}
