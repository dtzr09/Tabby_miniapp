import { QueryObserverResult } from "@tanstack/react-query";
import { ExpensesAndBudgets, TelegramWebApp } from "../utils/types";

export const deleteExpense = async (
  id: number,
  onRefetch: () => Promise<QueryObserverResult<ExpensesAndBudgets, Error>>
) => {
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
    await onRefetch();
  } catch (err) {
    console.error("Delete failed:", err);
  }
};

export const fetchExpenses = async (telegram_id: string, initData: string) => {
  const params = new URLSearchParams({
    telegram_id,
    initData,
  });

  const response = await fetch(`/api/expenses?${params.toString()}`).then(
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

  if (!response.ok) {
    throw new Error(
      `Expenses error ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const fetchExpensesAndBudgets = async (
  telegram_id: string,
  initData: string
) => {
  const params = new URLSearchParams({
    telegram_id,
    initData,
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
