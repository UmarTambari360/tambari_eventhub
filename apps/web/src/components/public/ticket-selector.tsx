'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Lock } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TicketTypeDTO } from '@eventhub/types';

interface TicketSelectorProps {
  ticketTypes: TicketTypeDTO[];
  onProceed: (selections: Array<{ ticketTypeId: string; quantity: number }>) => void;
  isLoading?: boolean;
}

interface Selection {
  [ticketTypeId: string]: number;
}

export function TicketSelector({ ticketTypes, onProceed, isLoading }: TicketSelectorProps) {
  const [selections, setSelections] = useState<Selection>({});

  const activeTypes = ticketTypes.filter((t) => t.isActive && t.isSaleOpen);

  function setQty(ticketTypeId: string, qty: number) {
    setSelections((prev) => {
      if (qty === 0) {
        const next = { ...prev };
        delete next[ticketTypeId];
        return next;
      }
      return { ...prev, [ticketTypeId]: qty };
    });
  }

  const totalKobo = activeTypes.reduce((sum, tt) => {
    const qty = selections[tt.id] ?? 0;
    return sum + tt.price * qty;
  }, 0);

  const totalQty = Object.values(selections).reduce((a, b) => a + b, 0);

  const isFreeOrder = activeTypes
    .filter((t) => (selections[t.id] ?? 0) > 0)
    .every((t) => t.price === 0);

  function handleProceed() {
    const result = Object.entries(selections)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));
    onProceed(result);
  }

  if (activeTypes.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Ticket sales are currently closed for this event.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Select Tickets</h2>
      </div>

      <div className="divide-y divide-gray-100">
        {activeTypes.map((tt) => {
          const qty = selections[tt.id] ?? 0;

          return (
            <div key={tt.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{tt.name}</p>
                  {tt.description && (
                    <p className="mt-0.5 text-sm text-gray-500 leading-snug">{tt.description}</p>
                  )}
                  <p className="mt-1.5 font-semibold text-violet-700">
                    {tt.price === 0 ? 'FREE' : formatNaira(tt.price)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{tt.available} available</p>
                </div>

                {/* Quantity control */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setQty(tt.id, Math.max(0, qty - 1))}
                    disabled={qty === 0}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-colors',
                      qty === 0
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-violet-300 text-violet-600 hover:bg-violet-50'
                    )}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>

                  <span className="w-6 text-center font-medium text-gray-900 tabular-nums">
                    {qty}
                  </span>

                  <button
                    onClick={() =>
                      setQty(tt.id, Math.min(tt.maxPurchase, Math.min(tt.available, qty + 1)))
                    }
                    disabled={qty >= tt.maxPurchase || qty >= tt.available}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-colors',
                      qty >= tt.maxPurchase || qty >= tt.available
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-violet-300 text-violet-600 hover:bg-violet-50'
                    )}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary + CTA */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        {totalQty > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">
              {totalQty} ticket{totalQty !== 1 ? 's' : ''}
            </span>
            <span className="font-semibold text-gray-900">
              {isFreeOrder ? 'FREE' : formatNaira(totalKobo)}
            </span>
          </div>
        )}

        <button
          onClick={handleProceed}
          disabled={totalQty === 0 || isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors',
            totalQty === 0 || isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          {totalQty === 0
            ? 'Select tickets to continue'
            : isFreeOrder
              ? 'Register Free'
              : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
}
