import { z } from 'zod';

export const rejectApplicationSchema = z.object({
  rejectionReason: z
    .string()
    .min(10, 'Please provide a reason of at least 10 characters')
    .max(500, 'Rejection reason must be at most 500 characters')
    .trim(),
});

export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;

export const suspendUserSchema = z.object({
  reason: z
    .string()
    .min(10, 'Please provide a reason of at least 10 characters')
    .max(500, 'Reason must be at most 500 characters')
    .trim(),
});

export type SuspendUserInput = z.infer<typeof suspendUserSchema>;

export const updateSettingSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .regex(/^[a-z_]+$/, 'Key must be lowercase with underscores only'),
  value: z.string().min(1, 'Value is required'),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

export const featureEventSchema = z.object({
  isFeatured: z.boolean(),
  featureOrder: z.number().int().min(1).max(99).nullable().optional(),
});

export const reorderFeaturedSchema = z.object({
  items: z
    .array(z.object({ id: z.string().uuid(), featureOrder: z.number().int().min(1).max(99) }))
    .min(1),
});

export const adminRefundSchema = z.object({
  reason: z.string().min(5, 'Please provide a reason').max(500).trim(),
});