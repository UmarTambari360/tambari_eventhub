import { CheckCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type CheckoutStep = 'attendees' | 'review' | 'processing';

interface CheckoutStepIndicatorProps {
  currentStep: CheckoutStep;
}

export function CheckoutStepIndicator({ currentStep }: CheckoutStepIndicatorProps) {
  const steps = ['attendees', 'review'] as const;
  const stepIndex = steps.indexOf(currentStep as 'attendees' | 'review');

  return (
    <div className="flex items-center gap-3 mb-6">
      {steps.map((s, i) => {
        const isDone = i < stepIndex;
        const isCurrent = s === currentStep || (currentStep === 'processing' && s === 'review');

        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                isDone
                  ? 'bg-primary-600 text-white'
                  : isCurrent
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : 'bg-surface-sunken text-text-muted'
              )}
            >
              {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-sm font-medium capitalize',
                isCurrent ? 'text-primary-700' : 'text-text-muted'
              )}
            >
              {s === 'attendees' ? 'Your Details' : 'Review & Pay'}
            </span>
            {i < 1 && <ChevronRight className="h-4 w-4 text-text-muted" />}
          </div>
        );
      })}
    </div>
  );
}
