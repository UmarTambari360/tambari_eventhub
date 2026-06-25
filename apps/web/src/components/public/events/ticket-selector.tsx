'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Lock } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TicketTypeDTO } from '@eventhub/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TicketSelectorProps {
  ticketTypes: TicketTypeDTO[];
  onProceed: (selections: Array<{ ticketTypeId: string; quantity: number }>) => void;
  isLoading?: boolean;
}

export function TicketSelector({ ticketTypes, onProceed, isLoading }: TicketSelectorProps) {
  const [selections, setSelections] = useState<Record<string, number>>({});

  const activeTypes = ticketTypes.filter((t) => t.isActive && t.isSaleOpen);

  function setQty(id: string, qty: number) {
    setSelections((prev) => {
      if (qty === 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: qty };
    });
  }

  const totalKobo = activeTypes.reduce((sum, tt) => sum + tt.price * (selections[tt.id] ?? 0), 0);
  const totalQty = Object.values(selections).reduce((a, b) => a + b, 0);
  const isFreeOrder = activeTypes
    .filter((t) => (selections[t.id] ?? 0) > 0)
    .every((t) => t.price === 0);

  if (activeTypes.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-text-muted mb-3" />
        <p className="body-sm text-text-muted">Ticket sales are currently closed.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border">
      <CardHeader className="px-5 py-4 border-b border-border">
        <CardTitle className="heading-sm text-text-primary">Select Tickets</CardTitle>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border">
        {activeTypes.map((tt) => {
          const qty = selections[tt.id] ?? 0;
          return (
            <div key={tt.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="heading-sm text-text-primary">{tt.name}</p>
                  {tt.description && (
                    <p className="body-sm text-text-muted mt-0.5 leading-snug">{tt.description}</p>
                  )}
                  <p
                    className={cn(
                      'mt-1.5 font-bold text-sm',
                      tt.price === 0 ? 'text-success' : 'text-brand'
                    )}
                  >
                    {tt.price === 0 ? 'FREE' : formatNaira(tt.price)}
                  </p>
                  <p className="caption text-text-muted mt-0.5">{tt.available} available</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => setQty(tt.id, Math.max(0, qty - 1))}
                    disabled={qty === 0}
                    variant="outline"
                    size="icon"
                    className={cn(
                      'h-8 w-8 rounded-full border transition-all',
                      qty === 0
                        ? 'border-border text-text-muted cursor-not-allowed'
                        : 'border-brand text-brand hover:bg-primary-50'
                    )}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center font-semibold text-text-primary tabular-nums">
                    {qty}
                  </span>
                  <Button
                    onClick={() => setQty(tt.id, Math.min(tt.maxPurchase, tt.available, qty + 1))}
                    disabled={qty >= tt.maxPurchase || qty >= tt.available}
                    variant="outline"
                    size="icon"
                    className={cn(
                      'h-8 w-8 rounded-full border transition-all',
                      qty >= tt.maxPurchase || qty >= tt.available
                        ? 'border-border text-text-muted cursor-not-allowed'
                        : 'border-brand text-brand hover:bg-primary-50'
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>

      <CardFooter className="px-5 py-4 bg-surface-raised border-t border-border flex-col">
        {totalQty > 0 && (
          <div className="flex items-center justify-between w-full mb-3">
            <span className="body-sm text-text-secondary">
              {totalQty} ticket{totalQty !== 1 ? 's' : ''}
            </span>
            <span className="font-bold text-text-primary">
              {isFreeOrder ? 'FREE' : formatNaira(totalKobo)}
            </span>
          </div>
        )}
        <Button
          onClick={() =>
            onProceed(
              Object.entries(selections)
                .filter(([, q]) => q > 0)
                .map(([id, quantity]) => ({ ticketTypeId: id, quantity }))
            )
          }
          disabled={totalQty === 0 || isLoading}
          className={cn(
            'w-full',
            totalQty === 0 || isLoading
              ? 'bg-surface-sunken text-text-muted cursor-not-allowed'
              : 'btn-primary'
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          {totalQty === 0
            ? 'Select tickets to continue'
            : isFreeOrder
              ? 'Register Free'
              : 'Proceed to Checkout'}
        </Button>
      </CardFooter>
    </Card>
  );
}
