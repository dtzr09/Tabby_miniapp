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

export const useChartData = (
  allEntries: AllEntriesResponse | undefined,
  dateRange: DateRange,
  viewType: "Week" | "Month",
  colors: ChartColors,
  isPersonalView?: boolean,
  userId?: string | number
): ChartDataPoint[] => {
  return useMemo(() => {
    // Only use expense entries from allEntries.expenses
    const entries =
      allEntries?.expenses?.map((expense) => {
        // Check if this is a personal view and expense has shares
        const personalData = getPersonalAmount(expense, !!isPersonalView, userId);

        return {
          id: expense.id,
          description: expense.description,
          category: expense.category?.name || "Other",
          emoji: expense.category?.emoji,
          date: expense.date,
          amount: personalData.amount,
          isIncome: expense.is_income,
        };
      }) || [];

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
      return Array.from(dailyTotals.entries()).map(([day, amount]) => ({
        name: day,
        amount,
        lineValue: amount * 1.1,
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
      return Array.from(dailyTotals.entries()).map(([day, amount]) => ({
        name: day,
        amount,
        lineValue: amount * 1.1,
        fill: day === todayKey ? colors.primary : colors.accent,
      }));
    }
  }, [dateRange, allEntries, colors.primary, colors.accent, viewType, isPersonalView, userId]);
};