'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddTicketTypeRowProps {
  eventId: string;
  onAdded: () => void;
  setError: (msg: string | null) => void;
}

function inputCls(hasError: boolean): string {
  return cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors bg-surface',
    hasError ? 'input-error' : 'border-border'
  );
}

export function AddTicketTypeRow({ eventId, onAdded, setError }: AddTicketTypeRowProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      price: 0,
      quantity: 100,
      minPurchase: 1,
      maxPurchase: 10,
      description: '',
    },
  });

  async function onSubmit(data: {
    name: string;
    price: number;
    quantity: number;
    minPurchase: number;
    maxPurchase: number;
    description: string;
  }) {
    setSaving(true);
    setError(null);
    try {
      await apiClient.post(`/events/${eventId}/ticket-types`, data);
      reset();
      setOpen(false);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ticket type');
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full border-dashed border-2 border-border text-text-muted hover:border-primary-300 hover:text-primary-600 py-6"
      >
        <Plus className="h-4 w-4" />
        Add Ticket Type
      </Button>
    );
  }

  return (
    <Card className="p-5 border-2 border-primary-300 border-border">
      <CardContent className="p-0">
        <h3 className="heading-sm text-text-primary mb-4">New Ticket Type</h3>
        <form onSubmit={handleSubmit((d) => void onSubmit(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Name *</label>
              <Input
                {...register('name', { required: true })}
                className={inputCls(!!errors.name)}
                placeholder="e.g. General Admission"
              />
            </div>
            <div>
              <label className="label-text">Price in kobo (0 = free) *</label>
              <Input
                {...register('price', { valueAsNumber: true })}
                type="number"
                min={0}
                step={100}
                className={inputCls(false)}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="label-text">Description</label>
            <Input
              {...register('description')}
              className={inputCls(false)}
              placeholder="What's included?"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-text">Quantity *</label>
              <Input
                {...register('quantity', { valueAsNumber: true })}
                type="number"
                min={1}
                className={inputCls(false)}
              />
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
          <div className="flex justify-end gap-3">
            <Button type="button" onClick={() => setOpen(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="btn-primary" size="sm">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
