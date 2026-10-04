/**
 * Helper utilities for currency formatting in INR using integer paise (bigint / number)
 */

export function paiseToRupees(paise: number | bigint): number {
  return Number(paise) / 100;
}

export function rupeesToPaise(rupees: number): bigint {
  return BigInt(Math.round(rupees * 100));
}

/**
 * Standard formatted INR string, e.g. "₹3,200.00" or "₹60"
 */
export function formatINR(paise: number | bigint, opts?: { hideDecimalsIfZero?: boolean }): string {
  const amount = paiseToRupees(paise);
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: opts?.hideDecimalsIfZero && amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
}

/**
 * Clean PDF-safe INR currency formatting (e.g. "Rs. 75,000.00") without font glyph encoding issues
 */
export function formatINRForPdf(paise: number | bigint, opts?: { hideDecimalsIfZero?: boolean }): string {
  const amount = paiseToRupees(paise);
  const formattedNumber = amount.toLocaleString('en-IN', {
    minimumFractionDigits: opts?.hideDecimalsIfZero && amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
  return `Rs. ${formattedNumber}`;
}

/**
 * Splits an amount into currency symbol, whole number with Indian comma separators, and decimals
 * E.g., for display: symbol "₹", whole "3.200" or "3,200", decimal ".00"
 */
export function splitAmountForDisplay(paise: number | bigint): {
  symbol: string;
  whole: string;
  fraction: string;
} {
  const amount = paiseToRupees(paise);
  const parts = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).formatToParts(amount);

  let symbol = '₹';
  let whole = '';
  let fraction = '00';

  let inFraction = false;
  for (const part of parts) {
    if (part.type === 'currency') {
      symbol = part.value;
    } else if (part.type === 'decimal') {
      inFraction = true;
    } else if (part.type === 'fraction') {
      fraction = part.value;
    } else if (!inFraction) {
      whole += part.value;
    }
  }

  return { symbol, whole, fraction: `.${fraction}` };
}
