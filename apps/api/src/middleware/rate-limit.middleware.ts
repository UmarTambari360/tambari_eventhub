import rateLimit from 'express-rate-limit';

/**
 * Centralized rate limit configurations.
 * Applied per-route in the respective route files.
 * These are the production values from the spec — dev behaviour is identical.
 */

// Generic error shape matching our API response format
const rateLimitError = (message: string) => ({
  success: false,
  error: {
    code: 'RATE_LIMITED',
    message,
  },
});

/**
 * Authentication endpoints — tight limits to prevent brute force.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError(
    'Too many login attempts. Please try again in 15 minutes.'
  ),
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError(
    'Too many registration attempts. Please try again later.'
  ),
});

export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError('Too many refresh attempts. Please slow down.'),
});

/**
 * File upload — per authenticated user (keyed by IP in absence of auth layer here).
 * Auth middleware runs before upload routes so IP is a reasonable proxy.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError(
    'Too many upload requests. Please wait a moment and try again.'
  ),
});

/**
 * General authenticated API routes.
 * Higher limit — these are legitimate business operations.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError(
    'Too many requests. Please slow down.'
  ),
});

/**
 * Unauthenticated public routes (event listings, event detail).
 */
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError(
    'Too many requests from this IP. Please try again later.'
  ),
});

/**
 * Admin routes — lower limit as these trigger expensive operations.
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError('Too many admin requests. Please slow down.'),
});

/**
 * Webhook endpoint — very permissive; Paystack fires many events.
 * Real protection is HMAC signature validation, not rate limiting.
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError('Too many webhook requests.'),
});

/**
 * Order creation — prevent inventory spam.
 */
export const orderCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitError(
    'Too many order creation attempts. Please wait a moment.'
  ),
});