'use client';

import { UseFormReturn } from 'react-hook-form';
import { CreateEventInput } from '@eventhub/validators';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EventDetailsSectionProps {
  form: UseFormReturn<CreateEventInput>;
  categories: readonly string[];
}

export function EventDetailsSection({ form, categories }: EventDetailsSectionProps) {
  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary">Event Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-primary">
                Event Title <span className="text-danger">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Lagos Music Festival 2025"
                  className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-primary">
                Description <span className="text-danger">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={5}
                  placeholder="Tell attendees what to expect at your event..."
                  className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500 resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-text-primary">Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                {...(field.value !== undefined ? { value: field.value } : {})}
              >
                <FormControl>
                  <SelectTrigger className="border-border bg-surface text-text-primary focus:ring-primary-500">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="border-border bg-surface-overlay">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}