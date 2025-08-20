import { AllEntriesResponse } from "../utils/types";
import { appCache } from "../utils/cache";

export const fetchAllEntries = async (
  telegram_id: string,
  initData: string,
  chat_id?: string | null
): Promise<AllEntriesResponse> => {
  try {
    // Check cache first
    const cacheKey = `allEntries_${telegram_id}_${chat_id || 'personal'}`;
    const cachedData = appCache.get<AllEntriesResponse>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    const params = new URLSearchParams({
      telegram_id,
      initData,
    });

    if (chat_id) {
      params.set("chat_id", chat_id);
    }

    // Fetch all entries with isIncome parameter
    const [expensesResponse, incomesResponse] = await Promise.all([
      fetch(`/api/entries?${params.toString()}&isIncome=false`),
      fetch(`/api/entries?${params.toString()}&isIncome=true`),
    ]);

    if (!expensesResponse.ok) {
      throw new Error(
        `Failed to fetch expenses: ${expensesResponse.statusText}`
      );
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
    let budgets = [];
    if (budgetsResponse.ok) {
      budgets = await budgetsResponse.json();
    } else if (budgetsResponse.status !== 404) {
      // Only throw for non-404 errors
      throw new Error(`Failed to fetch budgets: ${budgetsResponse.statusText}`);
    }

    const result = {
      expenses,
      income,
      budgets,
    };

    // Cache for 5 minutes since this data changes frequently
    appCache.set(cacheKey, result, 5 * 60 * 1000);

    return result;
  } catch (error) {
    console.error("Error fetching all entries:", error);
    return {
      expenses: [],
      income: [],
      budgets: [],
    };
  }
};
