// src/utils/format.ts

/**
 * Formats a number into a currency string using the user's locale.
 * Example: formatCurrency(12345.67) → "$12,345.67"
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',         // change to your desired currency code if needed
      minimumFractionDigits: 2,
    }).format(amount);
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
  