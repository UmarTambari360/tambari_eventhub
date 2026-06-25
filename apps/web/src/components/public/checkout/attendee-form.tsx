'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import type { OrderDTO } from '@eventhub/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface AttendeeFormProps {
  order: OrderDTO;
  form: any; // The form instance from react-hook-form
  direction: 'forward' | 'backward';
}

const slideVariants = {
  enterForward: { x: 40, opacity: 0 },
  enterBackward: { x: -40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitForward: { x: -40, opacity: 0 },
  exitBackward: { x: 40, opacity: 0 },
};

export function AttendeeForm({ order, form, direction }: AttendeeFormProps) {
  const totalAttendees = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div
      key="attendees"
      variants={slideVariants}
      initial={direction === 'forward' ? 'enterForward' : 'enterBackward'}
      animate="center"
      exit={direction === 'forward' ? 'exitForward' : 'exitBackward'}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Card className="p-6 space-y-6 border-border">
        <CardContent className="p-0 space-y-6">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            <h2 className="heading-sm text-text-primary">Attendee Details</h2>
            {totalAttendees > 0 && (
              <span className="caption text-text-muted ml-auto">
                {totalAttendees} attendee{totalAttendees !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <Form {...form}>
            {order.items.map((item) => {
              const itemIndex = order.items.indexOf(item);
              const startIdx = order.items
                .slice(0, itemIndex)
                .reduce((sum, x) => sum + x.quantity, 0);

              return (
                <div key={item.id}>
                  <p className="body-sm font-semibold text-text-secondary mb-3 pb-2 border-b border-border">
                    {item.ticketTypeName} × {item.quantity}
                    {item.pricePerTicket > 0 && (
                      <span className="font-normal text-text-muted ml-2">
                        ({formatNaira(item.pricePerTicket)} each)
                      </span>
                    )}
                  </p>

                  {Array.from({ length: item.quantity }).map((_, i) => {
                    const globalIdx = startIdx + i;

                    return (
                      <div key={i} className="mb-4 last:mb-0">
                        {item.quantity > 1 && (
                          <p className="caption text-text-muted mb-2">Ticket {i + 1}</p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`attendees.${globalIdx}.firstName`}
                            render={({ field }) => (
                              <FormItem className="col-span-2 sm:col-span-1">
                                <FormLabel className="label-text">First name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Emeka" className="input-base" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`attendees.${globalIdx}.lastName`}
                            render={({ field }) => (
                              <FormItem className="col-span-2 sm:col-span-1">
                                <FormLabel className="label-text">Last name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Okafor" className="input-base" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`attendees.${globalIdx}.email`}
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel className="label-text">Email *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    placeholder="emeka@example.com"
                                    className="input-base"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`attendees.${globalIdx}.ticketTypeId`}
                            render={({ field }) => (
                              <input type="hidden" {...field} value={item.ticketTypeId} />
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
