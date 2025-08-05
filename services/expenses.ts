import { QueryObserverResult } from "@tanstack/react-query";
import { Expense, TelegramWebApp } from "../utils/types";

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
  } catch (err) {
    console.error("Delete failed:", err);
  }
};

export const fetchExpenses = async (telegram_id: string, initData: string) => {
  const params = new URLSearchParams({
    telegram_id,
    initData,
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
  initData: string
) => {
  const params = new URLSearchParams({
    telegram_id,
    initData,
    isPeriod: "true",
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
    (budget: any) => budget.category_id
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

  return { expenses: expenses || [], budgets: budgetsResponse || [] };
};
