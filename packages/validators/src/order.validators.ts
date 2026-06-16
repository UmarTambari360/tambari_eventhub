import { z } from 'zod';

// ─── Order creation ───────────────────────────────────────────────────────────

export const orderItemSchema = z.object({
  ticketTypeId: z.string().uuid('Invalid ticket type ID'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(20, 'Quantity must be at most 20 per ticket type'),
});

export const createOrderSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one ticket must be selected')
    .max(10, 'Too many ticket types in one order'),
});

// ─── Payment initiation ───────────────────────────────────────────────────────

export const attendeeDetailSchema = z.object({
  ticketTypeId: z.string().uuid(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100)
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100)
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

export const initializePaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  attendees: z
    .array(attendeeDetailSchema)
    .min(1, 'Attendee details are required'),
  callbackUrl: z.string().url('Invalid callback URL').optional(),
});

// ─── Check-in ────────────────────────────────────────────────────────────────

export const checkInSchema = z.object({
  ticketCode: z
    .string()
    .min(1, 'Ticket code is required')
    .toUpperCase()
    .trim(),
});

// ─── Refund ──────────────────────────────────────────────────────────────────

export const refundOrderSchema = z.object({
  reason: z
    .string()
    .min(10, 'Please provide a reason of at least 10 characters')
    .max(500)
    .trim(),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AttendeeDetailInput = z.infer<typeof attendeeDetailSchema>;
export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type RefundOrderInput = z.infer<typeof refundOrderSchema>;