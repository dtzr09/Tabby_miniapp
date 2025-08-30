import { AllEntriesResponse } from "../utils/types";

export const fetchAllEntries = async (
  telegram_id: string,
  initData: string,
  chat_id?: string | null
): Promise<AllEntriesResponse> => {
  try {
    const params = new URLSearchParams({
      telegram_id,
      initData,
    });

    if (chat_id) {
      params.set("chat_id", chat_id);
    }

    // Fetch entries and budgets in parallel
    const [entriesResponse, budgetsResponse] = await Promise.all([
      // Use the new efficient all-entries endpoint (single query with UNION ALL)
      fetch(`/api/all-entries?${params.toString()}`),
      // Fetch budgets separately
      fetch(`/api/budgets?${params.toString()}`),
    ]);

    if (!entriesResponse.ok) {
      throw new Error(`Failed to fetch entries: ${entriesResponse.statusText}`);
    }

    const entriesData = await entriesResponse.json();
    
    // Handle budgets (may not exist)
    let budgets = [];
    if (budgetsResponse.ok) {
      budgets = await budgetsResponse.json();
    } else if (budgetsResponse.status !== 404) {
      // Only throw for non-404 errors
      throw new Error(`Failed to fetch budgets: ${budgetsResponse.statusText}`);
    }

    return {
      expenses: entriesData.expenses,
      income: entriesData.income,
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
