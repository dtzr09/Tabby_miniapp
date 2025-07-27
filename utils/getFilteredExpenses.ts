import { Expense, ViewMode } from "./types";

export const getFilteredExpenses = (expenses: Expense[], period: ViewMode) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return expenses.filter((exp) => {
    if (exp.is_income) return false; // Only show expenses, not income

    const expDate = new Date(exp.date);

    switch (period) {
      case "daily":
        return expDate >= today;
      case "weekly":
        const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
        const diffToMonday = (dayOfWeek + 6) % 7; // maps Sunday (0) → 6, Monday (1) → 0
        const monday = new Date(today);
        monday.setDate(today.getDate() - diffToMonday);
        return expDate >= monday;
      case "monthly":
        const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
        return expDate >= monthAgo;
      default:
        return false;
    }
  });
};
