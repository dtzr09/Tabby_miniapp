import { AllEntriesResponse, Expense, Income, Budget } from "./types";

export const calculateSummaryData = (allEntries: AllEntriesResponse) => {
  const expenses = allEntries.expenses;
  const income = allEntries.income;
  const budgets = allEntries.budgets;

  const totalIncome = income.reduce(
    (sum: number, income: Income) => sum + (income.amount || 0),
    0
  );

  const totalExpenses = expenses
    .filter((exp: Expense) => !exp.is_income)
    .reduce((sum: number, exp: Expense) => sum + Math.abs(exp.amount || 0), 0);

  // Calculate total budget from budgets data
  const totalBudget = budgets.reduce(
    (sum: number, budget: Budget) => sum + (budget.amount || 0),
    0
  );

  return { totalIncome, totalExpenses, totalBudget };
};
