import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/lib/utils';

type CheckoutStep = 'attendees' | 'review' | 'processing';

interface CheckoutNavigationProps {
  step: CheckoutStep;
  orderTotal: number;
  isFreeOrder: boolean;
  onBack: () => void;
  onContinue: () => void;
  isSubmitting?: boolean;
}

export function CheckoutNavigation({
  step,
  orderTotal,
  isFreeOrder,
  onBack,
  onContinue,
  isSubmitting = false,
}: CheckoutNavigationProps) {
  if (step === 'processing') {
    return (
      <div className="mt-5 flex justify-center">
        <div className="flex items-center gap-3 text-text-muted body-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          Redirecting to Paystack…
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex justify-between">
      {step === 'review' ? (
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="border-border text-text-secondary hover:bg-surface-raised"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      ) : (
        <div />
      )}

      {step === 'attendees' && (
        <Button type="button" onClick={onContinue} className="btn-primary">
          Review Order
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {step === 'review' && (
        <Button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isFreeOrder ? (
            'Complete Registration'
          ) : (
            <>
              Pay {formatNaira(orderTotal)}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
