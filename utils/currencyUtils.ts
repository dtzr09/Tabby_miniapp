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