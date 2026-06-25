import { motion } from 'framer-motion';
import { CreditCard, Shield, AlertCircle } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import type { OrderDTO } from '@eventhub/types';

interface OrderSummaryProps {
  order: OrderDTO;
  submitError: string | null;
  direction: 'forward' | 'backward';
}

const slideVariants = {
  enterForward: { x: 40, opacity: 0 },
  enterBackward: { x: -40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitForward: { x: -40, opacity: 0 },
  exitBackward: { x: 40, opacity: 0 },
};

export function OrderSummary({ order, submitError, direction }: OrderSummaryProps) {
  return (
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
          <CreditCard className="h-5 w-5 text-primary-600" />
          <h2 className="heading-sm text-text-primary">Order Summary</h2>
        </div>

        {/* Event info */}
        <div className="rounded-xl bg-surface-raised p-4">
          <p className="heading-sm text-text-primary">{order.event.title}</p>
          <p className="body-sm text-text-muted mt-0.5">
            {order.event.venue} · {order.event.location}
          </p>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between body-sm">
              <span className="text-text-secondary">
                {item.ticketTypeName} × {item.quantity}
              </span>
              <span className="font-medium text-text-primary">
                {item.pricePerTicket === 0 ? 'FREE' : formatNaira(item.subtotal)}
              </span>
            </div>
          ))}
          {order.serviceFee > 0 && (
            <div className="flex justify-between body-sm text-text-muted">
              <span>Service fee</span>
              <span>{formatNaira(order.serviceFee)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span className="text-text-primary">Total</span>
            <span className="text-brand">
              {order.isFreeOrder ? 'FREE' : formatNaira(order.totalAmount)}
            </span>
          </div>
        </div>

        {submitError && (
          <div className="flex items-center gap-2 rounded-lg bg-danger-light border border-danger/20 px-4 py-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {submitError}
          </div>
        )}

        <div className="flex items-center gap-2 body-sm text-text-muted">
          <Shield className="h-4 w-4 text-success shrink-0" />
          Payments secured by Paystack
        </div>
      </div>
    </motion.div>
  );
}