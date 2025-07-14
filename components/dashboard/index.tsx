import React, { useEffect, useState } from "react";
import AppHeader from "../navigation/AppHeader";
import ExpenseSummaryCard from "../cards/ExpenseSummaryCard";
import ExpenseList, { Transaction } from "../cards/ExpenseList";
import MonthlyBreakdownChart from "../charts/MonthlyBreakdownChart";
import YearlyOverviewChart from "../charts/YearlyOverviewChart";
import CategoryLegend from "../charts/CategoryLegend";
import { Box, Typography } from "@mui/material";

interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  category?: {
    name: string;
    emoji?: string;
  };
}

const Dashboard = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [user, setUser] = useState<{
    id: string;
    hash: string;
    user: any;// eslint-disable-line @typescript-eslint/no-explicit-any
  } | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.Telegram &&
      typeof window.Telegram.WebApp !== "undefined"
    ) {
      // Use type assertion for Telegram WebApp
      const tg = window.Telegram.WebApp as {
        initDataUnsafe?: { user?: { id: string }; hash?: string };
        initData?: string;
      };
      const user = tg.initDataUnsafe?.user;
      const hash = tg.initDataUnsafe?.hash;
      const initData = tg.initData;
      setUser({
        id: user?.id || "",
        user: user,
        hash: hash || "",
      });
      if (user && hash && initData) {
        const params = new URLSearchParams({
          telegram_id: user.id,
          hash,
          initData,
        });
        fetch(`/api/expenses?${params.toString()}`)
          .then((res) => res.json())
          .then((data) => {
            setExpenses(Array.isArray(data) ? data : []);
          })
          .catch(() => {
            setExpenses([]);
          });
      } else {
        setExpenses([]);
      }
    } else {
      setExpenses([]);
    }
  }, []);

  // Map expenses to transactions for ExpenseList
  const transactions: Transaction[] = expenses.map((exp) => ({
    description: exp.description,
    date: new Date(exp.date).toLocaleDateString(),
    amount: exp.amount,
    currency: "USD", // Adjust if you store currency
  }));

  // Example: Calculate total, income, expenses for summary card
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const income = expenses
    .filter((e) => e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0);
  const expenseTotal = expenses
    .filter((e) => e.amount < 0)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  // Example: Monthly breakdown by category
  const monthlyBreakdownData = Object.values(
    expenses.reduce((acc, exp) => {
      const cat = exp.category?.name || "Other";
      const emoji = exp.category?.emoji || "⚪";
      if (!acc[cat]) acc[cat] = { name: cat, value: 0, emoji };
      acc[cat].value += Math.abs(exp.amount);
      return acc;
    }, {} as Record<string, { name: string; value: number; emoji: string }>)
  ) as { name: string; value: number; emoji: string }[];

  // Example: Yearly overview (sum by month)
  const yearlyOverviewData = Object.values(
    expenses.reduce((acc, exp) => {
      const month = new Date(exp.date).toLocaleString("default", {
        month: "long",
      });
      if (!acc[month]) acc[month] = { month, value: 0 };
      acc[month].value += Math.abs(exp.amount);
      return acc;
    }, {} as Record<string, { month: string; value: number }>)
  ) as { month: string; value: number }[];

  // Example: Categories for legend
  const categories = Array.from(
    new Set(expenses.map((exp) => exp.category?.name || "Other"))
  ).map((name) => {
    const exp = expenses.find((e) => (e.category?.name || "Other") === name);
    return {
      name,
      emoji: exp?.category?.emoji || "⚪",
      color: "#42a5f5", // You can map to real colors if you store them
    };
  });

  return (
    <Box
      sx={{
        bgcolor: "#181f2a",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "inherit",
        p: 0,
        m: 0,
      }}
    >
      <Box sx={{ p: 2, bgcolor: "#222", borderRadius: 2, mb: 2 }}>
        <Typography variant="h6">Fetched Expenses (Test)</Typography>
        <pre style={{ color: "#90caf9", fontSize: 12, overflowX: "auto" }}>
          {JSON.stringify(expenses, null, 2)}
        </pre>
        <pre style={{ color: "#90caf9", fontSize: 12, overflowX: "auto" }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      </Box>
      <AppHeader />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 2,
          px: { xs: 1, sm: 0 },
        }}
      >
        <ExpenseSummaryCard
          total={total}
          income={income}
          expenses={expenseTotal}
          month={new Date().toLocaleString("default", { month: "long" })}
        />
        <Box sx={{ width: "100%", maxWidth: 400, mb: 2 }}>
          <ExpenseList transactions={transactions} />
        </Box>
        <Box sx={{ width: "100%", maxWidth: 400, mb: 2 }}>
          <MonthlyBreakdownChart
            data={monthlyBreakdownData}
            month={new Date().toLocaleString("default", { month: "long" })}
          />
        </Box>
        <Box sx={{ width: "100%", maxWidth: 400, mb: 2 }}>
          <YearlyOverviewChart
            data={yearlyOverviewData}
            year={new Date().getFullYear().toString()}
          />
        </Box>
        <Box sx={{ width: "100%", maxWidth: 400, mb: 2 }}>
          <CategoryLegend categories={categories} />
        </Box>
        <Typography
          sx={{
            color: "#90caf9",
            mt: 2,
            mb: 2,
            fontWeight: 600,
            fontSize: 18,
            textAlign: "center",
          }}
        >
          @Tabby
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
