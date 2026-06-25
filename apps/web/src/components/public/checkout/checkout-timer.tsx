import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutTimerProps {
  secondsLeft: number;
}

export function CheckoutTimer({ secondsLeft }: CheckoutTimerProps) {
  const minutesLeft = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div
      className={cn(
        'mb-5 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium',
        secondsLeft < 120
          ? 'bg-danger-light border border-danger/20 text-danger'
          : 'bg-warning-light border border-warning/20 text-warning'
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      Order reserved for{' '}
      <span className="font-bold tabular-nums">
        {minutesLeft}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
}
