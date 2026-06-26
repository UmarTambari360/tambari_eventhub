'use client';

import { UseFormReturn } from 'react-hook-form';
import { CreateEventInput } from '@eventhub/validators';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface LocationDateSectionProps {
  form: UseFormReturn<CreateEventInput>;
}

export function LocationDateSection({ form }: LocationDateSectionProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary">Location & Date</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-primary">
                  Venue <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Eko Atlantic Amphitheatre"
                    className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-primary">
                  City / Location <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Lagos"
                    className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-primary">Full Address (optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Plot 1, Eko Atlantic City, Victoria Island, Lagos"
                  className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="eventDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-primary">
                  Start Date & Time <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="datetime-local"
                    className="border-border bg-surface text-text-primary focus:ring-primary-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eventEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-primary">End Date & Time (optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="datetime-local"
                    className="border-border bg-surface text-text-primary focus:ring-primary-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
