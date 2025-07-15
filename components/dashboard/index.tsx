import React, { useEffect, useState } from "react";
import AppHeader from "../navigation/AppHeader";
import ExpenseSummaryCard from "../cards/ExpenseSummaryCard";
import ExpenseList from "../cards/ExpenseList";
import MonthlyBreakdownChart from "../charts/MonthlyBreakdownChart";
import YearlyOverviewChart from "../charts/YearlyOverviewChart";
import CategoryLegend from "../charts/CategoryLegend";
import { Box, Typography, Card } from "@mui/material";

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

  // Get the complete Telegram WebApp object for debugging
  const telegramWebApp = typeof window !== "undefined" && window.Telegram ? window.Telegram.WebApp : null;

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
        bgcolor: "#f3f6fa",
        minHeight: "100vh",
        color: "#222",
        fontFamily: "inherit",
        p: 0,
        m: 0,
      }}
    >
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
        {/* Debug: Complete Telegram WebApp Object */}
        <Box sx={{ width: "100%", maxWidth: 500, mb: 2 }}>
          <Card sx={{ bgcolor: "#fff", borderRadius: 3, boxShadow: 0, border: "1.5px solid #dde6f2", p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", mb: 2 }}>
              Complete Telegram WebApp Object
            </Typography>
            <pre style={{ color: "#90caf9", fontSize: 12, overflowX: "auto", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "4px" }}>
              {telegramWebApp ? JSON.stringify(telegramWebApp, null, 2) : "Telegram WebApp not available"}
            </pre>
          </Card>
        </Box>
        {/* Summary Card (now at the top) */}
        <ExpenseSummaryCard />
        {/* Recent Transactions Card (now below summary) */}
        <Box sx={{ width: "100%", maxWidth: 500, mb: 2 }}>
          <ExpenseList />
        </Box>
        {/* Charts wrapped in Card */}
        <Box sx={{ width: "100%", maxWidth: 400, mb: 2 }}>
          <Card sx={{ bgcolor: "#fff", borderRadius: 3, boxShadow: 0, p: 2 }}>
            <MonthlyBreakdownChart
              data={monthlyBreakdownData}
              month={new Date().toLocaleString("default", { month: "long" })}
            />
          </Card>
        </Box>
        <Box sx={{ width: "100%", maxWidth: 400, mb: 2 }}>
          <Card sx={{ bgcolor: "#fff", borderRadius: 3, boxShadow: 0, p: 2 }}>
            <YearlyOverviewChart
              data={yearlyOverviewData}
              year={new Date().getFullYear().toString()}
            />
          </Card>
        </Box>
        <Box sx={{ width: "100%", maxWidth: 400, mb: 2 }}>
          <Card sx={{ bgcolor: "#fff", borderRadius: 3, boxShadow: 0, p: 2 }}>
            <CategoryLegend categories={categories} />
          </Card>
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
