import { getCurrencyByCode } from "./preferencesData";

export const formatCurrency = (amount: number, currencyCode: string = "USD"): string => {
  const currency = getCurrencyByCode(currencyCode);
  
  if (!currency) {
    // Fallback to USD if currency not found
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
};

export const formatCurrencyCompact = (amount: number, currencyCode: string = "USD"): string => {
  const currency = getCurrencyByCode(currencyCode);
  
  if (!currency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
    }).format(amount);
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      notation: "compact",
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    if (amount >= 1000000) {
      return `${currency.symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${currency.symbol}${(amount / 1000).toFixed(1)}K`;
    } else {
      return `${currency.symbol}${amount.toFixed(0)}`;
    }
  }
};

export const getCurrencySymbol = (currencyCode: string = "USD"): string => {
  const currency = getCurrencyByCode(currencyCode);
  return currency?.symbol || "$";
};

/**
 * Rounds a number to 2 decimal places to avoid floating point precision issues
 * @param value - The number to round
 * @returns The rounded number with 2 decimal places
 */
export function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Safely divides an amount evenly among shares, handling floating point precision
 * @param totalAmount - The total amount to divide
 * @param numberOfShares - The number of shares to divide into
 * @returns The amount per share, rounded to 2 decimal places
 */
export function divideAmountEvenly(totalAmount: number, numberOfShares: number): number {
  if (numberOfShares === 0) return 0;
  return roundToCents(totalAmount / numberOfShares);
}

/**
 * Sums an array of currency values safely
 * @param values - Array of numbers to sum
 * @returns The sum, rounded to 2 decimal places
 */
export function sumCurrencyValues(values: number[]): number {
  const sum = values.reduce((acc, val) => acc + val, 0);
  return roundToCents(sum);
} 