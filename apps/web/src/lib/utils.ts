import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  // If custom options are passed, use them exclusively to avoid conflicts with 'dateStyle'
  const defaultOptions: Intl.DateTimeFormatOptions = options 
    ? options 
    : { dateStyle: 'medium' };

  return new Intl.DateTimeFormat('en-NG', defaultOptions).format(
    typeof date === 'string' ? new Date(date) : date
  );
}

export function toDatetimeLocalValue(isoOrLocal: string): string {
  if (!isoOrLocal) return '';
  // Already in datetime-local format (no offset)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(isoOrLocal)) return isoOrLocal;
  const d = new Date(isoOrLocal);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}