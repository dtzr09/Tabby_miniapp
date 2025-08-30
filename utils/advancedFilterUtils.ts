import { UnifiedEntry } from "./types";

export type FilterType = "all" | "type" | "day" | "week" | "month" | "category";

interface FilterConfig {
  id: FilterType;
  filter: (entry: UnifiedEntry) => boolean;
}

const createDateFilter = (days: number) => {
  return (entry: UnifiedEntry) => {
    const entryDate = new Date(entry.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(today);
    if (days === 0) { // day filter
      return entryDate.toDateString() === today.toDateString();
    } else if (days === 7) { // week filter
      compareDate.setDate(today.getDate() - 7);
    } else if (days === 30) { // month filter
      compareDate.setDate(1); // Start of current month
    }
    return entryDate >= compareDate;
  };
};

const filterConfigs: Record<FilterType, FilterConfig> = {
  all: {
    id: "all",
    filter: () => true,
  },
  type: {
    id: "type",
    filter: (entry) => !entry.isIncome, // Default to showing only expenses
  },
  day: {
    id: "day",
    filter: createDateFilter(0),
  },
  week: {
    id: "week",
    filter: createDateFilter(7),
  },
  month: {
    id: "month",
    filter: createDateFilter(30),
  },
  category: {
    id: "category",
    filter: (entry) => Boolean(entry.category), // Show only entries with categories
  },
};

export const applyFilter = (
  entries: UnifiedEntry[],
  filterType: FilterType,
  options?: {
    categoryId?: string;
    showIncome?: boolean;
  }
): UnifiedEntry[] => {
  const config = filterConfigs[filterType];
  
  if (!config) {
    console.warn(`Unknown filter type: ${filterType}`);
    return entries;
  }

  let filteredEntries = entries.filter(config.filter);

  // Apply additional filters based on options
  if (filterType === "type" && options?.showIncome !== undefined) {
    filteredEntries = filteredEntries.filter(entry => entry.isIncome === options.showIncome);
  }

  if (filterType === "category" && options?.categoryId) {
    filteredEntries = filteredEntries.filter(entry => entry.category?.id?.toString() === options.categoryId);
  }

  // Always sort by date (newest first)
  return filteredEntries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

// Helper function to get unique categories from entries
export const getUniqueCategories = (entries: UnifiedEntry[]) => {
  const categories = new Set<string>();
  entries.forEach(entry => {
    if (entry.category) {
      categories.add(entry.category.name);
    }
  });
  return Array.from(categories);
};

// Helper function to get statistics for the current filter
export const getFilterStats = (entries: UnifiedEntry[], filterType: FilterType) => {
  const filteredEntries = applyFilter(entries, filterType);
  
  return {
    total: filteredEntries.length,
    totalAmount: filteredEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0),
    expenseCount: filteredEntries.filter(entry => !entry.isIncome).length,
    incomeCount: filteredEntries.filter(entry => entry.isIncome).length,
  };
}; 