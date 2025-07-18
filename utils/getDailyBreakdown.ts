import { getFilteredExpenses } from "./getFilteredExpenses";
import { Expense } from "../components/dashboard";

// Function to generate daily/weekly breakdown from real expenses
export const getDailyBreakdown = (
  expenses: Expense[],
  period: "daily" | "weekly" | "monthly"
) => {
  const filteredExpenses = getFilteredExpenses(expenses, period);

  if (period === "daily") {
    // Group by hour for daily view
    const hourMap = new Map<number, number>();
    filteredExpenses.forEach((exp) => {
      const hour = new Date(exp.date).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + Math.abs(exp.amount));
    });

    return Array.from({ length: 24 }, (_, i) => ({
      day: `${i}:00`,
      amount: hourMap.get(i) || 0,
    }));
  } else if (period === "weekly") {
    // Group by day of week
    const dayMap = new Map<string, number>();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    filteredExpenses.forEach((exp) => {
      const day = dayNames[new Date(exp.date).getDay()];
      dayMap.set(day, (dayMap.get(day) || 0) + Math.abs(exp.amount));
    });

    return dayNames.map((day) => ({
      day,
      amount: dayMap.get(day) || 0,
    }));
  } else {
    // Group by week for monthly view
    const weekMap = new Map<number, number>();
    filteredExpenses.forEach((exp) => {
      const week = Math.ceil(new Date(exp.date).getDate() / 7);
      weekMap.set(week, (weekMap.get(week) || 0) + Math.abs(exp.amount));
    });

    return Array.from({ length: 4 }, (_, i) => ({
      day: `Week ${i + 1}`,
      amount: weekMap.get(i + 1) || 0,
    }));
  }
};
