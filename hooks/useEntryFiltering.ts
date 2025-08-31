import { useCallback, useMemo } from "react";
import { AllEntriesResponse, Expense, UnifiedEntry } from "../utils/types";
import { cleanCategoryName } from "../utils/categoryUtils";
import { getPersonalAmount } from "../utils/personalShareUtils";
import { FilterType } from "../utils/advancedFilterUtils";

interface FilterOptions {
  categoryId?: string;
  showIncome?: boolean;
}

interface DateRange {
  start: Date;
  end: Date;
}

export const useEntryFiltering = (
  allEntries: AllEntriesResponse | undefined,
  isPersonalView?: boolean,
  userId?: string | number,
  chat_id?: string,
  tgUserId?: string
) => {
  // Helper function to check if an expense is personal (user is payer and only participant)
  const isPersonalExpense = (expense: Expense): boolean => {
    if (!expense.shares || !Array.isArray(expense.shares)) {
      return false;
    }

    // Check if there's only one share and that share's user_id matches the payer_id
    if (expense.shares.length === 1) {
      const singleShare = expense.shares[0];
      const shareUserId =
        typeof singleShare.user_id === "string"
          ? parseInt(singleShare.user_id)
          : singleShare.user_id;
      const payerId =
        typeof expense.payer_id === "string"
          ? parseInt(expense.payer_id)
          : expense.payer_id;

      return shareUserId === payerId;
    }

    return false;
  };

  // Derive if we're in a group context
  const isGroup = chat_id !== tgUserId;
  const isGroupView = isGroup && !isPersonalView;

  // Combine income and expenses into unified entries
  const combineEntries = useCallback((): UnifiedEntry[] => {
    const combined: UnifiedEntry[] = [];

    // Add expenses
    allEntries?.expenses?.forEach((expense) => {
      // For group view, exclude income and personal expenses
      if (isGroupView) {
        if (expense.is_income || isPersonalExpense(expense)) {
          return; // Skip this expense
        }
      }

      const categoryName = expense.category?.name || "Other";
      const { emoji } = cleanCategoryName(categoryName);
      const personalData = getPersonalAmount(expense, !!isPersonalView, userId);

      combined.push({
        id: expense.id,
        description: expense.description,
        category: expense.category, // Use Category object instead of string
        emoji: expense.category?.emoji || emoji,
        date: expense.date,
        amount: personalData.amount,
        isIncome: expense.is_income,
        isPersonalShare: personalData.isPersonalShare,
        originalAmount: personalData.originalAmount,
        shares: personalData.userShare ? [personalData.userShare] : undefined,
        chat_id: expense.chat_id,
      });
    });

    // Add income entries
    allEntries?.income?.forEach((income) => {
      // For group view, exclude income entries
      if (isGroupView) {
        return; // Skip income entries for group view
      }

      const categoryName = income.category?.name || "Income";
      const { emoji } = cleanCategoryName(categoryName);

      combined.push({
        id: income.id,
        description: income.description,
        category: income.category, // Use Category object instead of string
        emoji: income.category?.emoji || emoji || "💰",
        date: income.date,
        amount: income.amount,
        isIncome: true,
        chat_id: income.chat_id,
      });
    });

    return combined;
  }, [allEntries, isPersonalView, userId, isGroupView, isPersonalExpense]);

  // Search function
  const searchExpenses = useCallback(
    (entries: UnifiedEntry[], query: string): UnifiedEntry[] => {
      if (!query.trim()) return [];

      const searchTerms = query.toLowerCase().trim().split(/\s+/);

      return entries.filter((entry) => {
        const searchableText = entry.description?.toLowerCase() || "";
        return searchTerms.every((term) => searchableText.includes(term));
      });
    },
    []
  );

  // Main filtering function
  const getFilteredEntries = useCallback(
    (
      isSearchActive: boolean,
      searchQuery: string,
      dateRange: DateRange,
      selectedDate: string | null,
      viewType: "Week" | "Month",
      filterOptions: FilterOptions
    ): UnifiedEntry[] => {
      let entries = combineEntries();

      // If search is active but query is empty, return empty array
      if (isSearchActive && !searchQuery.trim()) {
        return [];
      }

      // Apply search filter first if active
      if (isSearchActive && searchQuery) {
        entries = searchExpenses(entries, searchQuery);
      } else {
        // Only apply date filters if not searching
        // Apply date range filter first
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);

        // Set to start and end of day
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        entries = entries.filter((entry) => {
          const entryDate = new Date(entry.date);
          const isInRange = entryDate >= start && entryDate <= end;
          return isInRange;
        });

        // Apply date selection filter if active
        if (selectedDate) {
          entries = entries.filter((entry) => {
            const entryDate = new Date(entry.date);
            if (viewType === "Week") {
              const dayName = entryDate.toLocaleDateString("en-US", {
                weekday: "short",
              });
              return dayName === selectedDate;
            } else {
              // Make sure the format matches exactly what's shown in the chart
              const formattedDayMonth = `${entryDate.getDate()} ${entryDate.toLocaleDateString(
                "en-US",
                { month: "short" }
              )}`;
              return formattedDayMonth === selectedDate;
            }
          });
        }
      }

      // Apply category filter
      if (filterOptions.categoryId) {
        entries = entries.filter(
          (entry) => entry.category?.id?.toString() === filterOptions.categoryId
        );
      }

      // Apply type filter
      if (filterOptions.showIncome !== undefined) {
        entries = entries.filter((entry) =>
          filterOptions.showIncome ? entry.isIncome : !entry.isIncome
        );
      }

      // Sort by date, most recent first
      return entries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
    [combineEntries, searchExpenses]
  );

  return {
    combineEntries,
    searchExpenses,
    getFilteredEntries,
  };
};
