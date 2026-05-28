/**
 * Currency utilities for the EventHub platform.
 *
 * All monetary values are stored and computed in KOBO (1 NGN = 100 kobo).
 * This file is the single source of truth for all currency formatting.
 * Never store, transmit, or compute in naira directly.
 */

/**
 * Converts a naira amount to kobo.
 * Use this when accepting user input in naira (e.g. form fields).
 *
 * @param naira - Amount in naira (e.g. 2500)
 * @returns Amount in kobo (e.g. 250000)
 */
export function toKobo(naira: number): number {
  // Round to avoid floating-point issues
  return Math.round(naira * 100);
}

/**
 * Converts a kobo amount to naira.
 * Use this for display purposes only — never store the result.
 *
 * @param kobo - Amount in kobo (e.g. 250000)
 * @returns Amount in naira as a decimal number (e.g. 2500)
 */
export function toNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Formats a kobo amount as a Nigerian naira string.
 * Returns "FREE" for zero amounts.
 *
 * @param kobo - Amount in kobo
 * @param options.showFree - If true, returns "FREE" for 0 kobo (default: true)
 * @returns Formatted string e.g. "₦2,500.00" or "FREE"
 */
export function formatNaira(
  kobo: number,
  options: { showFree?: boolean } = {}
): string {
  const { showFree = true } = options;

  if (kobo === 0 && showFree) {
    return 'FREE';
  }

  const naira = toNaira(kobo);
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira);
}

/**
 * Calculates the platform service fee for a given amount.
 *
 * @param amountKobo - The ticket subtotal in kobo
 * @param feePercent - The fee percentage (e.g. 2.5 for 2.5%)
 * @returns The fee amount in kobo, rounded to the nearest kobo
 */
export function calculatePlatformFee(
  amountKobo: number,
  feePercent: number
): number {
  return Math.round((amountKobo * feePercent) / 100);
}

/**
 * Calculates the organizer's net amount after the platform fee.
 *
 * @param grossKobo - The gross ticket amount in kobo
 * @param feePercent - The fee percentage (e.g. 2.5 for 2.5%)
 * @returns The net amount the organizer receives in kobo
 */
export function calculateOrganizerNet(
  grossKobo: number,
  feePercent: number
): number {
  const fee = calculatePlatformFee(grossKobo, feePercent);
  return grossKobo - fee;
}

/**
 * Validates that a price value is a valid kobo amount.
 * Must be a non-negative integer.
 *
 * @param kobo - Value to validate
 * @returns true if valid
 */
export function isValidKoboAmount(kobo: number): boolean {
  return Number.isInteger(kobo) && kobo >= 0;
}