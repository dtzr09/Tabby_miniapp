/**
 * Backend currency utility functions for proper rounding
 * Ensures consistent currency precision across API endpoints
 */

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