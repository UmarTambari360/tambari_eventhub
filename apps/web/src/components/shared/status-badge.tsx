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
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  paid: {
    label: 'Paid',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  processing: {
    label: 'Processing',
    className: 'bg-violet-100 text-violet-800 border-violet-200',
  },
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
