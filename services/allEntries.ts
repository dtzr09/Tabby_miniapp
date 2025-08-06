import { AllEntriesResponse } from "../utils/types";

export const fetchAllEntries = async (
  telegram_id: string,
  initData: string
): Promise<AllEntriesResponse> => {
  const params = new URLSearchParams({
    telegram_id,
    initData,
  });

  const allPromises: Promise<any>[] = [];

  // Always fetch expenses
  const expensesResponse = fetch(`/api/expenses?${params.toString()}`).then(
    (res) => {
      if (!res.ok) {
        return res.text().then((text) => {
          console.error("❌ Expenses API Error:", text);
          throw new Error(`Expenses error ${res.status}: ${text}`);
        });
      }
      return res.json();
    }
  );
  allPromises.push(expensesResponse);

  // Always fetch income
  const incomeResponse = fetch(`/api/income?${params.toString()}`).then(
    (res) => {
      if (!res.ok) {
        return res.text().then((text) => {
          console.error("❌ Income API Error:", text);
          throw new Error(`Income error ${res.status}: ${text}`);
        });
      }
      return res.json();
    }
  );
  allPromises.push(incomeResponse);

  // budget will always be fetched for the current month
  let budgetsResponse: Promise<any> = Promise.resolve([]);
  budgetsResponse = fetch(`/api/budgets?${params.toString()}`).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        console.error("❌ Budgets API Error:", text);
        throw new Error(`Budgets error ${res.status}: ${text}`);
      });
    }
    return res.json();
  });
  allPromises.push(budgetsResponse);

  try {
    const [expenses, income, budgets] = await Promise.all(allPromises);

    return {
      expenses: expenses || [],
      income: income || [],
      budgets: budgets || [],
    };
  } catch (error) {
    console.error("❌ Error fetching all entries:", error);
    throw error;
  }
};
