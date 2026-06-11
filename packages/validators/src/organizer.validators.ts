import { z } from 'zod';

export const submitApplicationSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be at most 100 characters')
    .trim(),
  businessDescription: z
    .string()
    .min(50, 'Please provide at least 50 characters describing your business')
    .max(1000, 'Business description must be at most 1000 characters')
    .trim(),
  websiteUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  instagramHandle: z
    .string()
    .regex(
      /^@?[a-zA-Z0-9._]{1,30}$/,
      'Please enter a valid Instagram handle'
    )
    .optional()
    .or(z.literal('')),
  bankName: z.string().min(1, 'Please select a bank'),
  bankCode: z.string().min(1, 'Bank code is required'),
  bankAccountNumber: z
    .string()
    .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  bankAccountName: z
    .string()
    .min(2, 'Account name is required')
    .max(100, 'Account name is too long'),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;

export const verifyBankAccountSchema = z.object({
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  bankCode: z.string().min(1, 'Bank code is required'),
});

export type VerifyBankAccountInput = z.infer<typeof verifyBankAccountSchema>;