'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { updateTicketTypeSchema, type UpdateTicketTypeInput } from '@eventhub/validators';
import { formatNaira } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { OrganizerEventDTO } from '@eventhub/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TicketTypeRowProps {
  ticketType: OrganizerEventDTO['ticketTypes'][number];
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (data: UpdateTicketTypeInput) => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

function inputCls(hasError: boolean): string {
  return cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors bg-surface',
    hasError ? 'input-error' : 'border-border'
  );
}

export function TicketTypeRow({
  ticketType: tt,
  isExpanded,
  onToggle,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: TicketTypeRowProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateTicketTypeInput>({
    resolver: zodResolver(updateTicketTypeSchema),
    defaultValues: {
      name: tt.name,
      description: tt.description ?? '',
      price: tt.price,
      quantity: tt.quantity,
      minPurchase: tt.minPurchase,
      maxPurchase: tt.maxPurchase,
      isActive: tt.isActive,
    },
  });

  return (
    <Card className="overflow-hidden border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 bg-surface-raised hover:bg-surface-overlay transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="heading-sm text-text-primary truncate">{tt.name}</span>
          <Badge variant="secondary" className="shrink-0">
            {tt.price === 0 ? 'FREE' : formatNaira(tt.price)}
          </Badge>
          <span className="caption text-text-muted shrink-0">
            {tt.quantitySold}/{tt.quantity} sold
          </span>
          {!tt.isActive && (
            <Badge variant="destructive" className="shrink-0">
              Inactive
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting || tt.quantitySold > 0}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-text-muted hover:text-danger disabled:opacity-30"
            title={tt.quantitySold > 0 ? 'Cannot delete — tickets sold' : 'Delete ticket type'}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          )}
        </div>
      </button>

      {isExpanded && (
        <CardContent className="px-5 py-4 space-y-4">
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Name</label>
                <Input {...register('name')} className={inputCls(!!errors.name)} />
                {errors.name && <p className="field-error">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label-text">Price (kobo) — 0 for free</label>
                <Input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  min={0}
                  step={100}
                  className={inputCls(!!errors.price)}
                />
                {errors.price && <p className="field-error">{errors.price.message}</p>}
              </div>
            </div>

            <div>
              <label className="label-text">Description</label>
              <Input {...register('description')} className={inputCls(false)} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label-text">Quantity</label>
                <Input
                  {...register('quantity', { valueAsNumber: true })}
                  type="number"
                  min={tt.quantitySold}
                  className={inputCls(!!errors.quantity)}
                />
                {errors.quantity && <p className="field-error">{errors.quantity.message}</p>}
                {tt.quantitySold > 0 && (
                  <p className="caption text-text-muted mt-0.5">Min: {tt.quantitySold} (sold)</p>
                )}
              </div>
              <div>
                <label className="label-text">Min per order</label>
                <Input
                  {...register('minPurchase', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  className={inputCls(false)}
                />
              </div>
              <div>
                <label className="label-text">Max per order</label>
                <Input
                  {...register('maxPurchase', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={20}
                  className={inputCls(false)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`active-${tt.id}`}
                {...register('isActive')}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor={`active-${tt.id}`} className="body-sm text-text-secondary">
                Active (visible to buyers)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="submit"
                disabled={isSaving || !isDirty}
                className="btn-primary"
                size="sm"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
