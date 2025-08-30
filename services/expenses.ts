import { QueryObserverResult } from "@tanstack/react-query";
import { Expense, TelegramWebApp, BudgetWithCategory } from "../utils/types";
import { fetchUser } from "./users";

export const deleteExpense = async (id: number) => {
  try {
    const webApp = window.Telegram?.WebApp as TelegramWebApp;
    const user = webApp.initDataUnsafe?.user;
    const initData = webApp.initData;

    if (!user?.id || !initData) {
      throw new Error("Missing Telegram user/init data");
    }

    const response = await fetch(`/api/expenses/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        telegram_id: user.id.toString(),
        initData,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete expense");
    }

    console.log("🗑️ Expense deleted successfully");
  } catch (err) {
    console.error("Delete failed:", err);
    throw err; // Re-throw to maintain error handling
  }
};

export const fetchExpenses = async (
  telegram_id: string,
  initData: string,
  group_id: string
) => {
  const user = await fetchUser(telegram_id, initData, group_id);
  if (!user) {
    throw new Error("User not found");
  }

  const params = new URLSearchParams({
    telegram_id,
    initData,
    group_id,
    user: JSON.stringify(user),
  });

  const response = await fetch(`/api/expenses?${params.toString()}`);

  if (!response.ok) {
    const text = await response.text();
    console.error("❌ Expenses API Error:", text);
    throw new Error(`Expenses error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const fetchExpenseDetail = async (
  id: number,
  telegram_id: string,
  initData: string
) => {
  const params = new URLSearchParams({
    telegram_id,
    initData,
  });

  const response = await fetch(`/api/expenses/${id}?${params.toString()}`).then(
    (res) => {
      if (!res.ok) {
        return res.text().then((text) => {
          console.error("❌ Expense Detail API Error:", text);
          throw new Error(`Expense Detail error ${res.status}: ${text}`);
        });
      }
      return res.json();
    }
  );

  if (!response.ok) {
    throw new Error(
      `Expense Detail error ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  if (data.expense) {
    return data.expense;
  }
  return "test";
};

export const fetchExpensesAndBudgets = async (
  telegram_id: string,
  initData: string,
  group_id: string
) => {
  const user = await fetchUser(telegram_id, initData, group_id);
  if (!user) {
    throw new Error("User not found");
  }
  const params = new URLSearchParams({
    telegram_id,
    initData,
    group_id: group_id,
    isPeriod: "true",
    user: JSON.stringify(user),
  });

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

  const budgetsResponse = fetch(`/api/budgets?${params.toString()}`).then(
    (res) => {
      if (!res.ok) {
        return res.text().then((text) => {
          console.error("❌ Budgets API Error:", text);
          throw new Error(`Budgets error ${res.status}: ${text}`);
        });
      }
      return res.json();
    }
  );

  const [expenses, budgets] = await Promise.all([
    expensesResponse,
    budgetsResponse,
  ]);

  return { expenses: expenses || [], budgets: budgets || [] };
};

export const fetchGroupExpenses = async (
  telegram_id: string,
  initData: string,
  group_id: string,
  group_view: boolean
) => {
  const user = await fetchUser(telegram_id, initData, group_id);
  if (!user) {
    throw new Error("User not found");
  }
  //fetch all expenses from the group whether or not user is involved
  const params = new URLSearchParams({
    telegram_id,
    initData,
    group_id,
    isPeriod: "true",
    group_view: group_view.toString(),
    user: JSON.stringify(user),
  });

  const response = await fetch(`/api/group-expenses?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `Group expenses error ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
};

export const fetchExpensesForBudgets = async (
  telegram_id: string,
  initData: string
) => {
  const params = new URLSearchParams({
    telegram_id,
    initData,
    isPeriod: "true",
  });

  const budgetsResponse = await fetch(`/api/budgets?${params.toString()}`).then(
    (res) => {
      if (!res.ok) {
        return res.text().then((text) => {
          console.error("❌ Budgets API Error:", text);
          throw new Error(`Budgets error ${res.status}: ${text}`);
        });
      }
      return res.json();
    }
  );

  const budgetCategoriesIds = budgetsResponse.map(
    (budget: BudgetWithCategory) => budget.category_id
  );

  const expensesParams = new URLSearchParams({
    telegram_id,
    initData,
    budgetCategoriesIds: budgetCategoriesIds.join(","),
  });

  const expensesResponse = await fetch(
    `/api/expenses/budget-expenses-month?${expensesParams.toString()}`
  ).then((res) => {
    if (!res.ok) {
      return res.text().then((text) => {
        console.error("❌ Expenses API Error:", text);
        throw new Error(`Expenses error ${res.status}: ${text}`);
      });
    }
    return res.json();
  });

  const expenses = await expensesResponse;

  return expenses;
};

export const updateExpenseAmount = async (
  id: number,
  amount: number,
  initData: string,
  chat_id: string,
  isIncome: boolean
) => {
  try {
    const response = await fetch(`/api/entries/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        chat_id: chat_id,
        initData,
        isIncome,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Update expense amount API Error:", text);
      throw new Error(
        `Update expense amount error ${response.status}: ${text}`
      );
    }

    return response.json();
  } catch (err) {
    console.error("Update expense amount failed:", err);
    throw err;
  }
};

export const updateExpenseShares = async (
  id: number,
  shares: Array<{ user_id: string | number; share_amount: number }>,
  initData: string,
  chat_id: string
) => {
  try {
    const response = await fetch(`/api/entries/${id}/shares`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shares,
        chat_id: chat_id,
        initData,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Update expense shares API Error:", text);
      throw new Error(
        `Update expense shares error ${response.status}: ${text}`
      );
    }

    return response.json();
  } catch (err) {
    console.error("Update expense shares failed:", err);
    throw err;
  }
};
