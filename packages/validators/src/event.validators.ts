import { z } from 'zod';

function toIsoDatetime(val: unknown): unknown {
  if (val === '' || val === undefined || val === null) return val;
  if (typeof val !== 'string') return val;
  // Already ISO 8601 with offset
  if (/[Zz]|[+-]\d{2}:\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toISOString();
}

const isoDatetime = z.preprocess(
  toIsoDatetime,
  z.string({ required_error: 'Event date is required' }).datetime({ offset: true })
);

const optionalIsoDatetime = z.preprocess(
  toIsoDatetime,
  z.string().datetime({ offset: true }).optional().or(z.literal(''))
);

// ─── Ticket Type ──────────────────────────────────────────────────────────────

export const createTicketTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Ticket name is required')
    .max(100, 'Ticket name must be at most 100 characters')
    .trim(),
  description: z.string().max(500).trim().optional().or(z.literal('')),
  price: z
    .number({ required_error: 'Price is required' })
    .int('Price must be a whole number in kobo')
    .min(0, 'Price cannot be negative'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(100_000, 'Quantity must be at most 100,000'),
  saleStartDate: optionalIsoDatetime,
  saleEndDate: optionalIsoDatetime,
  minPurchase: z.number().int().min(1).default(1),
  maxPurchase: z.number().int().min(1).max(20).default(10),
});

export const updateTicketTypeSchema = createTicketTypeSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateTicketTypeInput = z.infer<typeof createTicketTypeSchema>;
export type UpdateTicketTypeInput = z.infer<typeof updateTicketTypeSchema>;

// ─── Event ────────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  'Music',
  'Business',
  'Arts',
  'Food',
  'Sports',
  'Tech',
  'Fashion',
  'Culture',
  'Comedy',
  'Religion',
] as const;

export const createEventSchema = z.object({
  title: z
    .string({ required_error: 'Event title is required' })
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title must be at most 150 characters')
    .trim(),
  description: z
    .string({ required_error: 'Description is required' })
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be at most 5000 characters')
    .trim(),
  venue: z
    .string({ required_error: 'Venue is required' })
    .min(3, 'Venue must be at least 3 characters')
    .max(200)
    .trim(),
  location: z
    .string({ required_error: 'Location (city) is required' })
    .min(2)
    .max(100)
    .trim(),
  address: z.string().max(300).trim().optional().or(z.literal('')),
  eventDate: isoDatetime,
  eventEndDate: optionalIsoDatetime,
  category: z.enum(VALID_CATEGORIES).optional(),
  tags: z.array(z.string().max(30).trim()).max(10).default([]),
  bannerImageUrl: z.string().url().optional().or(z.literal('')),
  bannerPublicId: z.string().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  thumbnailPublicId: z.string().optional().or(z.literal('')),
  ticketTypes: z
    .array(createTicketTypeSchema)
    .min(1, 'At least one ticket type is required')
    .max(10, 'Maximum 10 ticket types per event'),
});

export const updateEventSchema = z.object({
  title: z.string().min(5).max(150).trim().optional(),
  description: z.string().min(20).max(5000).trim().optional(),
  venue: z.string().min(3).max(200).trim().optional(),
  location: z.string().min(2).max(100).trim().optional(),
  address: z.string().max(300).trim().optional().or(z.literal('')),
  eventDate: optionalIsoDatetime,
  eventEndDate: optionalIsoDatetime,
  category: z.enum(VALID_CATEGORIES).optional(),
  tags: z.array(z.string().max(30).trim()).max(10).optional(),
  bannerImageUrl: z.string().url().optional().or(z.literal('')),
  bannerPublicId: z.string().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  thumbnailPublicId: z.string().optional().or(z.literal('')),
});

export const publishEventSchema = z.object({
  publish: z.boolean(),
});

// ─── Public filter schema ─────────────────────────────────────────────────────

export const eventFilterSchema = z.object({
  search: z.string().max(100).trim().optional(),
  category: z.string().optional(),
  location: z.string().max(100).optional(),
  isFree: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  dateFrom: optionalIsoDatetime,
  dateTo: optionalIsoDatetime,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(40).default(12),
  sortBy: z.enum(['date', 'created', 'popular']).default('date'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventFilterInput = z.infer<typeof eventFilterSchema>;