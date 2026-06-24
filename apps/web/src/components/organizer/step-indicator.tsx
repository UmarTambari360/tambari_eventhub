import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
              i < currentStep
                ? 'bg-primary-600 text-white'
                : i === currentStep
                  ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                  : 'bg-surface-sunken text-text-muted'
            )}
          >
            {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={cn(
              'text-sm font-medium',
              i === currentStep ? 'text-primary-700' : 'text-text-muted'
            )}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={cn('mx-2 h-0.5 w-8', i < currentStep ? 'bg-primary-600' : 'bg-border')}
            />
          )}
        </div>
      ))}
    </div>
  );
}
