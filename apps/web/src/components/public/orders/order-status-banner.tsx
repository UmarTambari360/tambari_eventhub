import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { OrderStatus } from '@eventhub/types';

interface OrderStatusBannerProps {
  status: OrderStatus;
  isFreeOrder: boolean;
}

export function OrderStatusBanner({ status, isFreeOrder }: OrderStatusBannerProps) {
  if (status === 'paid') {
    return (
      <Alert className="mb-6 border-success/20 bg-success-light">
        <CheckCircle className="h-5 w-5 text-success" />
        <AlertTitle className="heading-sm text-success">
          {isFreeOrder ? 'Registration Confirmed!' : 'Payment Successful!'}
        </AlertTitle>
        <AlertDescription className="body-sm text-success/80">
          {isFreeOrder
            ? 'Your free tickets have been confirmed. Check your email for details.'
            : 'Your tickets are confirmed. Check your email for QR codes.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'processing' || status === 'pending') {
    return (
      <Alert className="mb-6 border-warning/20 bg-warning-light">
        <Clock className="h-5 w-5 text-warning" />
        <AlertTitle className="heading-sm text-warning">Payment Pending</AlertTitle>
        <AlertDescription className="body-sm text-warning/80">
          We're confirming your payment. This usually takes a few seconds.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'failed' || status === 'cancelled') {
    return (
      <Alert className="mb-6 border-danger/20 bg-danger-light">
        <XCircle className="h-5 w-5 text-danger" />
        <AlertTitle className="heading-sm text-danger">
          {status === 'failed' ? 'Payment Failed' : 'Order Cancelled'}
        </AlertTitle>
        <AlertDescription className="body-sm text-danger/80">
          {status === 'failed'
            ? 'Your payment was not successful. No charge was made.'
            : 'This order has been cancelled.'}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
