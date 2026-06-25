'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { getOrderAction, initializePaymentAction } from '@/actions/order.actions';
import { CheckoutTimer } from '@/components/public/checkout/checkout-timer';
import { CheckoutStepIndicator } from '@/components/public/checkout/checkout-step-indicator';
import { AttendeeForm } from '@/components/public/checkout/attendee-form';
import { OrderSummary } from '@/components/public/checkout/order-summary';
import { CheckoutNavigation } from '@/components/public/checkout/checkout-navigation';
import { CheckoutHeader } from '@/components/public/checkout/checkout-header';
import type { OrderDTO } from '@eventhub/types';

// ─── Local schema (mirrors API attendee detail) ───────────────────────────────

const attendeeSchema = z.object({
  ticketTypeId: z.string(),
  firstName: z.string().min(1, 'First name required').max(100).trim(),
  lastName: z.string().min(1, 'Last name required').max(100).trim(),
  email: z.string().email('Valid email required').toLowerCase().trim(),
  phoneNumber: z.string().optional(),
});

const checkoutSchema = z.object({
  attendees: z.array(attendeeSchema),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;
type CheckoutStep = 'attendees' | 'review' | 'processing';

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const auth = useAuth();

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<CheckoutStep>('attendees');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { attendees: [] },
  });

  const { control, handleSubmit, trigger } = form;
  useFieldArray({ control, name: 'attendees' });

  // Load order
  useEffect(() => {
    if (!auth?.accessToken || !orderId) return;

    void (async () => {
      const result = await getOrderAction(orderId, auth.accessToken!);
      if (!result.success || !result.data) {
        router.replace('/events');
        return;
      }

      const orderData = result.data;
      setOrder(orderData);

      if (orderData.status === 'paid') {
        router.replace(`/orders/${orderData.orderNumber}`);
        return;
      }
      if (orderData.status === 'cancelled' || orderData.status === ('expired' as string)) {
        router.replace('/events');
        return;
      }

      if (orderData.expiresAt) {
        setExpiresAt(new Date(orderData.expiresAt));
      }

      // Pre-populate attendees with user data
      const attendees: CheckoutFormValues['attendees'] = [];
      for (const item of orderData.items) {
        for (let i = 0; i < item.quantity; i++) {
          attendees.push({
            ticketTypeId: item.ticketTypeId,
            firstName: auth?.user?.fullName?.split(' ')[0] ?? '',
            lastName: auth?.user?.fullName?.split(' ').slice(1).join(' ') ?? '',
            email: auth?.user?.email ?? '',
            phoneNumber: '',
          });
        }
      }
      form.reset({ attendees });

      setLoading(false);
    })();
  }, [auth?.accessToken, orderId, router, auth?.user, form]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) {
        router.replace('/events?expired=true');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, router]);

  const goForward = async () => {
    if (step === 'attendees') {
      const valid = await trigger('attendees');
      if (!valid) return;
      setDirection('forward');
      setStep('review');
    }
  };

  const goBack = () => {
    setDirection('backward');
    setStep('attendees');
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!auth?.accessToken || !orderId) return;
    setStep('processing');
    setSubmitError(null);

    const attendees = data.attendees.map((attendee) => ({
      ...attendee,
      phoneNumber: attendee.phoneNumber ?? '',
    }));

    const result = await initializePaymentAction(orderId, attendees, auth.accessToken);

    if (!result.success || !result.data) {
      setSubmitError(result.error ?? 'Payment initialization failed.');
      setStep('review');
      return;
    }

    window.location.href = result.data.authorizationUrl;
  };

  if (loading || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-raised py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <CheckoutHeader order={order} />

        {expiresAt && secondsLeft > 0 && <CheckoutTimer secondsLeft={secondsLeft} />}

        <CheckoutStepIndicator currentStep={step} />

        <form onSubmit={handleSubmit((d) => void onSubmit(d))} noValidate>
          <AnimatePresence mode="wait" initial={false}>
            {step === 'attendees' && (
              <AttendeeForm order={order} form={form} direction={direction} />
            )}

            {(step === 'review' || step === 'processing') && (
              <OrderSummary order={order} submitError={submitError} direction={direction} />
            )}
          </AnimatePresence>

          <CheckoutNavigation
            step={step}
            orderTotal={order.totalAmount}
            isFreeOrder={order.isFreeOrder}
            onBack={goBack}
            onContinue={goForward}
            isSubmitting={step === 'processing'}
          />
        </form>
      </div>
    </div>
  );
}
