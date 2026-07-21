/**
 * Formats a number as Indian Rupee (₹) currency.
 * Example: 125000 -> "₹1,25,000" or "₹1,25,000.00" if decimal requested.
 */
export function formatCurrency(
  amount: number,
  showDecimals: boolean = false
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const rounded = Math.round(amount * 100) / 100;
  
  try {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    });
    return formatter.format(rounded);
  } catch {
    // Fallback formatting if Intl fails
    const parts = rounded.toFixed(showDecimals ? 2 : 0).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `₹${integerPart}${parts[1] ? '.' + parts[1] : ''}`;
  }
}

/**
 * Formats date for display in history table and header.
 * Example: "21 Jul 2026, 05:30 PM"
 */
export function formatDate(isoStringOrTimestamp: string | number): string {
  if (!isoStringOrTimestamp) return '-';
  
  const date = new Date(isoStringOrTimestamp);
  if (isNaN(date.getTime())) return String(isoStringOrTimestamp);

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Short date format for compact table views.
 * Example: "21 Jul 2026"
 */
export function formatShortDate(isoStringOrTimestamp: string | number): string {
  if (!isoStringOrTimestamp) return '-';
  const date = new Date(isoStringOrTimestamp);
  if (isNaN(date.getTime())) return String(isoStringOrTimestamp);

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Safely parses input string into a valid balance number.
 */
export function parseBalanceInput(val: string): number {
  if (!val) return 0;
  // Remove currency symbols, spaces, commas
  const cleanVal = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanVal);
  return isNaN(parsed) ? 0 : parsed;
}
