import { Budget, Expense, ViewMode, DBData } from "./types";
import { getFilteredExpenses } from "./getFilteredExpenses";
import { getCategoryData } from "./getCategoryData";
import { getDailyBreakdown } from "./getDailyBreakdown";

export const getDashboardData = (
  expenses: Expense[],
  budgets: Budget[],
  period: ViewMode
): DBData => {
  // Get expenses filtered by the selected time period
  const filteredExpenses = getFilteredExpenses(expenses, period);

  // Calculate total expenses for the period
  const totalExpenses = filteredExpenses.reduce(
    (sum: number, exp: Expense) => sum + Math.abs(exp.amount || 0),
    0
  );

  // Get category data with budget comparison
  const categories = getCategoryData(expenses, budgets, period);

  // Get daily expense breakdown
  const dailyExpenses = getDailyBreakdown(expenses, period);

  // Count non-flexible budgets
  const numOfBudgets =
    budgets.filter(
      (budget: Budget) =>
        !budget.category.name.toLowerCase().includes("flexible")
    ).length || 0;

  return {
    totalExpenses,
    dateRange:
      period === "daily"
        ? "Today"
        : period === "weekly"
        ? "This Week"
        : "This Month",
    dailyExpenses,
    categories,
    num_of_budgets: numOfBudgets,
  };
};
