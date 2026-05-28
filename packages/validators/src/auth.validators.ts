import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please enter a valid email address.')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must not exceed 72 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
  fullName: z
    .string({ required_error: 'Full name is required.' })
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name must not exceed 100 characters.')
    .trim(),
  phoneNumber: z
    .string()
    .regex(
      /^\+?[0-9]{10,15}$/,
      'Please enter a valid phone number (10–15 digits, optional + prefix).'
    )
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please enter a valid email address.')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;