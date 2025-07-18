import { Expense } from "../components/cards/ExpensesOverviewCard";

export const getFilteredExpenses = (
  expenses: Expense[],
  period: "daily" | "weekly" | "monthly"
) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return expenses.filter((exp) => {
    if (exp.is_income) return false; // Only show expenses, not income

    const expDate = new Date(exp.date);

    switch (period) {
      case "daily":
        return expDate >= today;
      case "weekly":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expDate >= weekAgo;
      case "monthly":
        const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
        return expDate >= monthAgo;
      default:
        return false;
    }
  });
};
