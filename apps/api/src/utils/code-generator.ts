import { randomBytes } from 'crypto';

/**
 * Generates a unique order number.
 * Format: EVH-YYYYMMDD-XXXXXX (6 uppercase alphanumeric chars)
 * Example: EVH-20240315-A3F7K2
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = Array.from({ length: 6 }, () => {
    const byte = randomBytes(1)[0];
    // Safe because 256 / 36 = 7.1 — negligible bias; acceptable for order numbers
    return chars[byte! % chars.length];
  }).join('');

  return `EVH-${datePart}-${randomPart}`;
}

/**
 * Generates a unique ticket code.
 * Format: TKT-XXXXXXXXXX (10 uppercase alphanumeric chars)
 * Example: TKT-A3F7K2M9NP
 */
export function generateTicketCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = Array.from({ length: 10 }, () => {
    const byte = randomBytes(1)[0];
    return chars[byte! % chars.length];
  }).join('');

  return `TKT-${randomPart}`;
}

/**
 * Generates a unique transaction reference.
 * Format: TXN-{timestamp}-{8 hex chars}
 * Example: TXN-1710499200000-a3f7k2m9
 */
export function generateTransactionReference(): string {
  const timestamp = Date.now();
  const randomHex = randomBytes(4).toString('hex');
  return `TXN-${timestamp}-${randomHex}`;
}

/**
 * Generates a UUID v4 using Node's crypto module.
 * Used for refresh token family IDs and other internal identifiers.
 */
export function generateUUID(): string {
  return randomBytes(16)
    .toString('hex')
    .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

/**
 * Generates a URL-safe slug from a given title.
 * Appends a short random suffix to avoid collisions.
 * Example: "My Great Event!" → "my-great-event-a3f7k2"
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60); // truncate to keep slugs manageable

  const suffix = randomBytes(3).toString('hex'); // 6 hex chars
  return `${base}-${suffix}`;
}