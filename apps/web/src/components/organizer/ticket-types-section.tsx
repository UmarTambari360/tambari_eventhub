'use client';

import { useState } from 'react';
import {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormReturn,
} from 'react-hook-form';
import { CreateEventInput } from '@eventhub/validators';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TicketTypeSectionProps {
  fields: FieldArrayWithId<CreateEventInput, 'ticketTypes', 'id'>[];
  form: UseFormReturn<CreateEventInput>;
  onAppend: UseFieldArrayAppend<CreateEventInput, 'ticketTypes'>;
  onRemove: UseFieldArrayRemove;
  canRemove: boolean;
}

export function TicketTypeSection({
  fields,
  form,
  onAppend,
  onRemove,
  canRemove,
}: TicketTypeSectionProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-text-primary">Ticket Types</CardTitle>
            <p className="text-text-muted text-xs mt-0.5">
              At least one ticket type required. Set price to 0 for free tickets.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onAppend({
                name: '',
                price: 0,
                quantity: 100,
                minPurchase: 1,
                maxPurchase: 10,
              })
            }
            disabled={fields.length >= 10}
            className="border-accent-300 text-accent-600 hover:bg-accent-50"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Ticket Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {form.formState.errors.ticketTypes?.root && (
          <p className="text-danger text-sm mb-4">
            {form.formState.errors.ticketTypes.root.message}
          </p>
        )}

        <div className="space-y-4">
          {fields.map((field, idx) => (
            <TicketTypeRow
              key={field.id}
              index={idx}
              form={form}
              canRemove={canRemove}
              onRemove={() => onRemove(idx)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TicketTypeRowProps {
  index: number;
  form: UseFormReturn<CreateEventInput>;
  canRemove: boolean;
  onRemove: () => void;
}

function TicketTypeRow({ index, form, canRemove, onRemove }: TicketTypeRowProps) {
  const [expanded, setExpanded] = useState(true);
//  const error = form.formState.errors.ticketTypes?.[index];

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-surface-raised cursor-pointer hover:bg-surface-sunken transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-sm font-medium text-text-primary">Ticket Type {index + 1}</span>
        <div className="flex items-center gap-2">
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="h-7 w-7 p-0 text-text-muted hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={`ticketTypes.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">
                    Ticket Name <span className="text-danger">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. General Admission"
                      className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`ticketTypes.${index}.price`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">
                    Price in kobo — 0 for free <span className="text-danger">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step={100}
                      placeholder="0"
                      className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500"
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="mt-0.5 text-xs text-text-muted">e.g. 1500000 = ₦15,000</p>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name={`ticketTypes.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-primary">Description (optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="What's included with this ticket?"
                    className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name={`ticketTypes.${index}.quantity`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">
                    Quantity <span className="text-danger">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      className="border-border bg-surface text-text-primary focus:ring-primary-500"
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`ticketTypes.${index}.minPurchase`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Min per order</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      className="border-border bg-surface text-text-primary focus:ring-primary-500"
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`ticketTypes.${index}.maxPurchase`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-primary">Max per order</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={20}
                      className="border-border bg-surface text-text-primary focus:ring-primary-500"
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
