import { AllEntriesResponse } from "../utils/types";

export const fetchAllEntries = async (
  telegram_id: string,
  initData: string
): Promise<AllEntriesResponse> => {
  try {
    const params = new URLSearchParams({
      telegram_id,
      initData,
    });

    // Fetch all entries with isIncome parameter
    const [expensesResponse, incomesResponse] = await Promise.all([
      fetch(`/api/entries?${params.toString()}&isIncome=false`),
      fetch(`/api/entries?${params.toString()}&isIncome=true`),
    ]);

    if (!expensesResponse.ok) {
      throw new Error(`Failed to fetch expenses: ${expensesResponse.statusText}`);
    }

    if (!incomesResponse.ok) {
      throw new Error(`Failed to fetch income: ${incomesResponse.statusText}`);
    }

    const [expenses, income] = await Promise.all([
      expensesResponse.json(),
      incomesResponse.json(),
    ]);

    // Fetch budgets
    const budgetsResponse = await fetch(`/api/budgets?${params.toString()}`);
    if (!budgetsResponse.ok) {
      throw new Error(`Failed to fetch budgets: ${budgetsResponse.statusText}`);
    }
    const budgets = await budgetsResponse.json();

    return {
      expenses,
      income,
      budgets,
    };
  } catch (error) {
    console.error("Error fetching all entries:", error);
    return {
      expenses: [],
      income: [],
      budgets: [],
    };
  }
};
