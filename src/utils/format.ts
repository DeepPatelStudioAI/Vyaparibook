// src/utils/format.ts

/**
 * Formats a number into Indian currency string without decimal.
 * Example: formatCurrency(12345.67) → "₹12,346"
 */
export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Formats an ISO date string into a more readable form.
 * Example: formatDate("2025-07-03T12:34:56Z") → "Jul 03, 2025"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}
