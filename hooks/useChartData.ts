import { useMemo } from "react";
import { AllEntriesResponse } from "../utils/types";
import { getPersonalAmount } from "../utils/personalShareUtils";

interface DateRange {
  start: Date;
  end: Date;
}

interface ChartDataPoint {
  name: string;
  amount: number;
  lineValue: number;
  fill: string;
}

interface ChartColors {
  primary: string;
  accent: string;
}

interface FilterOptions {
  categoryId?: string;
  showIncome?: boolean;
}

export const useChartData = (
  allEntries: AllEntriesResponse | undefined,
  dateRange: DateRange,
  viewType: "Week" | "Month",
  colors: ChartColors,
  isPersonalView?: boolean,
  userId?: string | number,
  filterOptions?: FilterOptions
): ChartDataPoint[] => {
  return useMemo(() => {
    // Combine both expenses and income entries
    const allEntriesData = [
      ...(allEntries?.expenses?.map((expense) => {
        const personalData = getPersonalAmount(expense, !!isPersonalView, userId);
        return {
          id: expense.id,
          description: expense.description,
          category: expense.category,
          emoji: expense.category?.emoji,
          date: expense.date,
          amount: personalData.amount,
          isIncome: expense.is_income,
        };
      }) || []),
      ...(allEntries?.income?.map((income) => ({
        id: income.id,
        description: income.description,
        category: income.category,
        emoji: income.category?.emoji,
        date: income.date,
        amount: income.amount,
        isIncome: true,
      })) || [])
    ];

    // Apply filters
    let entries = allEntriesData;
    
    // Filter by entry type (income vs expense)
    if (filterOptions?.showIncome !== undefined) {
      entries = entries.filter((entry) =>
        filterOptions.showIncome ? entry.isIncome : !entry.isIncome
      );
    }

    // Filter by category
    if (filterOptions?.categoryId) {
      entries = entries.filter(
        (entry) => entry.category?.id?.toString() === filterOptions.categoryId
      );
    }

    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    // Create a map to store daily totals
    const dailyTotals = new Map<string, number>();

    if (viewType === "Week") {
      // Initialize all days in the range with 0
      const current = new Date(start);
      while (current <= end) {
        const dayKey = current.toLocaleDateString("en-US", {
          weekday: "short",
        });
        dailyTotals.set(dayKey, 0);
        current.setDate(current.getDate() + 1);
      }

      // Sum up amounts for each day
      entries.forEach((entry) => {
        const entryDate = new Date(entry.date);
        if (entryDate >= start && entryDate <= end) {
          const dayKey = entryDate.toLocaleDateString("en-US", {
            weekday: "short",
          });
          const currentTotal = dailyTotals.get(dayKey) || 0;
          dailyTotals.set(dayKey, currentTotal + Math.abs(entry.amount));
        }
      });

      // Convert to chart data format
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
      });
      
      // Calculate average spending for the week
      const totalSpending = Array.from(dailyTotals.values()).reduce((sum, amount) => sum + amount, 0);
      const averageSpending = totalSpending / dailyTotals.size;
      
      return Array.from(dailyTotals.entries()).map(([day, amount]) => ({
        name: day,
        amount,
        lineValue: averageSpending,
        fill: day === today ? colors.primary : colors.accent,
      }));
    } else {
      // Monthly view
      const current = new Date(start);
      const month = current.toLocaleDateString("en-US", { month: "short" });

      // Initialize all days in the month with 0
      while (current <= end) {
        const day = current.getDate();
        const dayKey = `${day} ${month}`;
        dailyTotals.set(dayKey, 0);
        current.setDate(current.getDate() + 1);
      }

      // Sum up amounts for each day
      entries.forEach((entry) => {
        const entryDate = new Date(entry.date);
        if (entryDate >= start && entryDate <= end) {
          const day = entryDate.getDate();
          const dayKey = `${day} ${month}`;
          const currentTotal = dailyTotals.get(dayKey) || 0;
          dailyTotals.set(dayKey, currentTotal + Math.abs(entry.amount));
        }
      });

      // Convert to chart data format
      const today = new Date();
      const todayKey = `${today.getDate()} ${month}`;
      
      // Calculate average spending for the month
      const totalSpending = Array.from(dailyTotals.values()).reduce((sum, amount) => sum + amount, 0);
      const averageSpending = totalSpending / dailyTotals.size;
      
      return Array.from(dailyTotals.entries()).map(([day, amount]) => ({
        name: day,
        amount,
        lineValue: averageSpending,
        fill: day === todayKey ? colors.primary : colors.accent,
      }));
    }
  }, [dateRange, allEntries, colors.primary, colors.accent, viewType, isPersonalView, userId, filterOptions]);
};