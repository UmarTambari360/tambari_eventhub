'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  User,
  CreditCard,
  Shield,
} from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { getOrderAction, initializePaymentAction } from '@/actions/order.actions';
import { formatNaira } from '@/lib/utils';
import { cn } from '@/lib/utils';
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

const slideVariants = {
  enterForward: { x: 40, opacity: 0 },
  enterBackward: { x: -40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitForward: { x: -40, opacity: 0 },
  exitBackward: { x: 40, opacity: 0 },
};

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

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { attendees: [] },
  });

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

      // Check if already paid / expired
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

      setLoading(false);
    })();
  }, [auth?.accessToken, orderId, router]);

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

  // Build attendee defaults from order items
  useEffect(() => {
    if (!order) return;
    // Pre-populate with buyer's email
    const defaults: CheckoutFormValues['attendees'] = [];
    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        defaults.push({
          ticketTypeId: item.ticketTypeId,
          firstName: auth?.user?.fullName?.split(' ')[0] ?? '',
          lastName: auth?.user?.fullName?.split(' ').slice(1).join(' ') ?? '',
          email: auth?.user?.email ?? '',
          phoneNumber: '',
        });
      }
    }
    // Reset form with defaults
    void (async () => {
      const { useForm: _ } = await import('react-hook-form');
    })();
  }, [order, auth?.user]);

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

    // Redirect to Paystack
    window.location.href = result.data.authorizationUrl;
  };

  if (loading || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

//   const totalAttendees = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const minutesLeft = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="min-h-screen bg-(--surface-raised) py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="heading-xl text-(--text-primary)">Checkout</h1>
          <p className="body-sm text-(--text-muted) mt-1">
            {order.event.title} · {order.items.reduce((s, i) => s + i.quantity, 0)} ticket(s)
          </p>
        </div>

        {/* Timer */}
        {expiresAt && secondsLeft > 0 && (
          <div
            className={cn(
              'mb-5 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium',
              secondsLeft < 120
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            )}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            Order reserved for{' '}
            <span className="font-bold tabular-nums">
              {minutesLeft}:{String(secs).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Step indicators */}
        <div className="flex items-center gap-3 mb-6">
          {(['attendees', 'review'] as const).map((s, i) => {
            const stepIndex = ['attendees', 'review'].indexOf(step);
            const isDone = i < stepIndex;
            const isCurrent = s === step || (step === 'processing' && s === 'review');
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    isDone
                      ? 'bg-violet-600 text-white'
                      : isCurrent
                        ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                        : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium capitalize',
                    isCurrent ? 'text-violet-700' : 'text-gray-400'
                  )}
                >
                  {s === 'attendees' ? 'Your Details' : 'Review & Pay'}
                </span>
                {i < 1 && <ChevronRight className="h-4 w-4 text-gray-300" />}
              </div>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((d) => void onSubmit(d))} noValidate>
          <AnimatePresence mode="wait" initial={false}>
            {step === 'attendees' && (
              <motion.div
                key="attendees"
                variants={slideVariants}
                initial={direction === 'forward' ? 'enterForward' : 'enterBackward'}
                animate="center"
                exit={direction === 'forward' ? 'exitForward' : 'exitBackward'}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="card p-6 space-y-6">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-violet-600" />
                    <h2 className="heading-sm text-(--text-primary)">Attendee Details</h2>
                  </div>

                  {order.items.map((item) => (
                    <div key={item.id}>
                      <p className="body-sm font-semibold text-(--text-secondary) mb-3 pb-2 border-b border-(--border)">
                        {item.ticketTypeName} × {item.quantity}
                        {item.pricePerTicket > 0 && (
                          <span className="font-normal text-(--text-muted) ml-2">
                            ({formatNaira(item.pricePerTicket)} each)
                          </span>
                        )}
                      </p>

                      {Array.from({ length: item.quantity }).map((_, i) => {
                        // Calculate global index
                        const globalIdx =
                          order.items
                            .slice(0, order.items.indexOf(item))
                            .reduce((s, x) => s + x.quantity, 0) + i;

                        return (
                          <div key={i} className="mb-4 last:mb-0">
                            {item.quantity > 1 && (
                              <p className="caption text-(--text-muted) mb-2">Ticket {i + 1}</p>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="label-text">First name *</label>
                                <input
                                  {...register(`attendees.${globalIdx}.firstName`)}
                                  className={inputCls(!!errors.attendees?.[globalIdx]?.firstName)}
                                  placeholder="Emeka"
                                />
                                {errors.attendees?.[globalIdx]?.firstName && (
                                  <p className="field-error">
                                    {errors.attendees[globalIdx]?.firstName?.message}
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="label-text">Last name *</label>
                                <input
                                  {...register(`attendees.${globalIdx}.lastName`)}
                                  className={inputCls(!!errors.attendees?.[globalIdx]?.lastName)}
                                  placeholder="Okafor"
                                />
                                {errors.attendees?.[globalIdx]?.lastName && (
                                  <p className="field-error">
                                    {errors.attendees[globalIdx]?.lastName?.message}
                                  </p>
                                )}
                              </div>
                              <div className="col-span-2">
                                <label className="label-text">Email *</label>
                                <input
                                  {...register(`attendees.${globalIdx}.email`)}
                                  type="email"
                                  className={inputCls(!!errors.attendees?.[globalIdx]?.email)}
                                  placeholder="emeka@example.com"
                                />
                                {errors.attendees?.[globalIdx]?.email && (
                                  <p className="field-error">
                                    {errors.attendees[globalIdx]?.email?.message}
                                  </p>
                                )}
                              </div>
                              <input
                                type="hidden"
                                {...register(`attendees.${globalIdx}.ticketTypeId`)}
                                value={item.ticketTypeId}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {(step === 'review' || step === 'processing') && (
              <motion.div
                key="review"
                variants={slideVariants}
                initial={direction === 'forward' ? 'enterForward' : 'enterBackward'}
                animate="center"
                exit="exitForward"
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="card p-6 space-y-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-violet-600" />
                    <h2 className="heading-sm text-(--text-primary)">Order Summary</h2>
                  </div>

                  {/* Event info */}
                  <div className="rounded-xl bg-(--surface-raised) p-4">
                    <p className="heading-sm text-(--text-primary)">{order.event.title}</p>
                    <p className="body-sm text-(--text-muted) mt-0.5">
                      {order.event.venue} · {order.event.location}
                    </p>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between body-sm">
                        <span className="text-(--text-secondary)">
                          {item.ticketTypeName} × {item.quantity}
                        </span>
                        <span className="font-medium text-(--text-primary)">
                          {item.pricePerTicket === 0 ? 'FREE' : formatNaira(item.subtotal)}
                        </span>
                      </div>
                    ))}
                    {order.serviceFee > 0 && (
                      <div className="flex justify-between body-sm text-(--text-muted)">
                        <span>Service fee</span>
                        <span>{formatNaira(order.serviceFee)}</span>
                      </div>
                    )}
                    <div className="border-t border-(--border) pt-2 flex justify-between font-bold">
                      <span className="text-(--text-primary)">Total</span>
                      <span className="text-(--primary)">
                        {order.isFreeOrder ? 'FREE' : formatNaira(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {submitError}
                    </div>
                  )}

                  <div className="flex items-center gap-2 body-sm text-(--text-muted)">
                    <Shield className="h-4 w-4 text-green-500 shrink-0" />
                    Payments secured by Paystack
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step !== 'processing' && (
            <div className="mt-5 flex justify-between">
              {step === 'review' ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 rounded-xl border border-(--border) px-5 py-2.5 body-sm font-medium text-(--text-secondary) hover:bg-(--surface-raised) transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step === 'attendees' && (
                <button
                  type="button"
                  onClick={() => void goForward()}
                  className="btn btn-primary btn-md"
                >
                  Review Order
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {step === 'review' && (
                <button type="submit" className="btn btn-primary btn-md">
                  {order.isFreeOrder ? (
                    'Complete Registration'
                  ) : (
                    <>
                      Pay {formatNaira(order.totalAmount)}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="mt-5 flex justify-center">
              <div className="flex items-center gap-3 text-(--text-muted) body-sm">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                Redirecting to Paystack…
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn('input-base', hasError && 'border-red-300 bg-red-50');
}
