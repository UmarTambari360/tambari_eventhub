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
  key: z.string().min(1),
  value: z.string().min(1),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;