import { UnifiedEntry } from "./types";
import { cleanCategoryName } from "./categoryUtils";

// Filter option types
export type AmountFilterOption = "All Amounts" | "Under $10" | "$10 - $50" | "$50 - $100" | "Over $100";
export type DateFilterOption = "All Dates" | "Today" | "Yesterday" | "This Week" | "This Month";
export type CategoryFilterOption = "All Categories" | string;

interface FilterOptions {
  searchQuery: string;
  categoryFilter: CategoryFilterOption;
  amountFilter: AmountFilterOption;
  dateFilter: DateFilterOption;
}

/**
 * Checks if an entry matches the search query
 */
const matchesSearch = (entry: UnifiedEntry, searchQuery: string): boolean => {
  if (!searchQuery.trim()) return true;

  const query = searchQuery.toLowerCase();
  const categoryName = entry.category?.name || "Other";
  const cleanCategoryNameValue = cleanCategoryName(categoryName).name;

  return (
    entry.description.toLowerCase().includes(query) ||
    cleanCategoryNameValue.toLowerCase().includes(query)
  );
};

/**
 * Checks if an entry matches the category filter
 */
const matchesCategory = (entry: UnifiedEntry, categoryFilter: CategoryFilterOption): boolean => {
  if (categoryFilter === "All Categories") return true;

  const categoryName = entry.category?.name || "Other";
  const cleanCategoryNameValue = cleanCategoryName(categoryName).name;
  return cleanCategoryNameValue === categoryFilter;
};

/**
 * Checks if an entry matches the amount filter
 */
const matchesAmount = (entry: UnifiedEntry, amountFilter: AmountFilterOption): boolean => {
  if (amountFilter === "All Amounts") return true;

  const amount = Math.abs(entry.amount);
  switch (amountFilter) {
    case "Under $10":
      return amount < 10;
    case "$10 - $50":
      return amount >= 10 && amount <= 50;
    case "$50 - $100":
      return amount >= 50 && amount <= 100;
    case "Over $100":
      return amount > 100;
    default:
      return true;
  }
};

/**
 * Checks if an entry matches the date filter
 */
const matchesDate = (entry: UnifiedEntry, dateFilter: DateFilterOption): boolean => {
  if (dateFilter === "All Dates") return true;

  const entryDate = new Date(entry.date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(today.getMonth() - 1);

  switch (dateFilter) {
    case "Today":
      return entryDate.toDateString() === today.toDateString();
    case "Yesterday":
      return entryDate.toDateString() === yesterday.toDateString();
    case "This Week":
      return entryDate >= weekAgo;
    case "This Month":
      return entryDate >= monthAgo;
    default:
      return true;
  }
};

/**
 * Filters and sorts transactions based on search query and filters
 */
export const filterTransactions = (
  entries: UnifiedEntry[],
  filterOptions: FilterOptions
): UnifiedEntry[] => {
  const { searchQuery, categoryFilter, amountFilter, dateFilter } = filterOptions;

  return entries
    .filter(
      (entry) =>
        matchesSearch(entry, searchQuery) &&
        matchesCategory(entry, categoryFilter) &&
        matchesAmount(entry, amountFilter) &&
        matchesDate(entry, dateFilter)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}; 