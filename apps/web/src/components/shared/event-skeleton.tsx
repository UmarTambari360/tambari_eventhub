import { cn } from '@/lib/utils';

interface EventCardSkeletonProps {
  className?: string;
}

export function EventCardSkeleton({ className }: EventCardSkeletonProps) {
  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="skeleton h-44 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}

export function EventGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="skeleton h-72 md:h-96 rounded-2xl" />
          <div className="skeleton h-10 w-3/4 rounded" />
          <div className="space-y-3">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
