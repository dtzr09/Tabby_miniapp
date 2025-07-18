import React, { useEffect, useState } from "react";
import ExpenseSummaryCard from "../cards/ExpenseSummaryCard";
import ExpenseList from "../cards/ExpenseList";
import BalanceCard from "../cards/BalanceCard";
import { Box, Typography } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { getDailyBreakdown } from "../../utils/getDailyBreakdown";
import { getFilteredExpenses } from "../../utils/getFilteredExpenses";
import { getCategoryData } from "../../utils/getCategoryData";
import ExpensesAndBudgetOverview from "../cards/ExpensesAndBudgetOverview";

export interface Budget {
  id: number;
  amount: number;
  created_at: string;
  updated_at: string;
  category: {
    id: number;
    name: string;
  };
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  is_income: boolean;
  category?: {
    name: string;
    emoji?: string;
  };
}

const Dashboard = () => {
  const { colors, fontFamily } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // For development/testing - use hardcoded data when not in Telegram WebApp
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
          initData,
        });

        console.log("🔍 Fetching expenses with params:", {
          telegram_id: user.id,
          hasInitData: !!initData,
          url: `/api/expenses?${params.toString()}`,
        });

        // Fetch expenses
        fetch(`/api/expenses?${params.toString()}`)
          .then((res) => {
            console.log("📡 Expenses API response status:", res.status);
            if (!res.ok) {
              return res.text().then((text) => {
                console.error("❌ API Error response:", text);
                throw new Error(
                  `HTTP error! status: ${res.status}, body: ${text}`
                );
              });
            }
            return res.json();
          })
          .then((data) => {
            console.log("✅ Expenses data received:", data);
            const expensesArray = Array.isArray(data) ? data : [];
            setExpenses(expensesArray);
          })
          .catch((error) => {
            console.error("❌ Error fetching expenses:", error);
            setExpenses([]);
          });

        // Fetch budgets
        fetch(`/api/budgets?${params.toString()}`)
          .then((res) => {
            console.log("📡 Budgets API response status:", res.status);
            if (!res.ok) {
              return res.text().then((text) => {
                console.error("❌ Budgets API Error response:", text);
                throw new Error(
                  `HTTP error! status: ${res.status}, body: ${text}`
                );
              });
            }
            return res.json();
          })
          .then((data) => {
            console.log("✅ Budgets data received:", data);
            const budgetsArray = Array.isArray(data) ? data : [];
            setBudgets(budgetsArray);
          })
          .catch((error) => {
            console.error("❌ Error fetching budgets:", error);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        console.log("⚠️ Telegram WebApp data not available, using fallback");
        setLoading(false);
      }
    } else {
      console.log("⚠️ Not in Telegram WebApp environment");
      setLoading(false);
    }
  }, []);

  // Calculate summary data from real expenses
  const totalIncome = expenses
    .filter((exp) => exp.is_income)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalExpenses = expenses
    .filter((exp) => !exp.is_income)
    .reduce((sum, exp) => sum + Math.abs(exp.amount), 0);

  // Calculate total budget from budgets data
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);

  // Calculate remaining balance as total budget minus expenses
  const totalBalance = totalBudget - totalExpenses;

  const [internalViewMode, setInternalViewMode] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");

  // Generate real data based on expenses
  const getRealData = (period: "daily" | "weekly" | "monthly") => {
    const filteredExpenses = getFilteredExpenses(expenses, period);
    const totalExpenses = filteredExpenses.reduce(
      (sum, exp) => sum + Math.abs(exp.amount),
      0
    );
    const categories = getCategoryData(expenses, budgets, period);
    const dailyExpenses = getDailyBreakdown(expenses, period);

    return {
      totalExpenses,
      dateRange:
        period === "daily"
          ? "Today"
          : period === "weekly"
          ? "This Week"
          : "This Month",
      dailyExpenses,
      categories,
      num_of_budgets: budgets.filter(
        (budget) => !budget.category.name.toLowerCase().includes("flexible")
      ).length,
    };
  };

  const data = getRealData(internalViewMode);

  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: colors.background,
          minHeight: "100vh",
          color: colors.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: colors.background,
        minHeight: "100vh",
        color: colors.text,
        fontFamily: fontFamily,
        m: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          maxWidth: "24rem",
          bgcolor: colors.background,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: 2,
            px: { xs: 2, sm: 1, md: 0 },
            gap: 2,
          }}
        >
          {/* Balance Card */}
          {totalBudget > 0 && (
            <Box sx={{ width: "100%" }}>
              <BalanceCard
                availableBalance={totalBalance}
                daysRemaining={30 - new Date().getDate()}
                dailyBudget={totalBalance / (30 - new Date().getDate())}
                totalBudget={totalBudget}
              />
            </Box>
          )}

          <ExpenseSummaryCard
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
          />

          {/* Budget Overview Card */}
          <Box sx={{ width: "100%" }}>
            <ExpensesAndBudgetOverview
              data={data}
              viewMode={internalViewMode}
              onViewModeChange={setInternalViewMode}
            />
          </Box>

          <Box sx={{ width: "100%" }}></Box>

          {/* Recent Transactions Card (now below summary) */}
          <Box sx={{ width: "100%" }}>
            <ExpenseList expenses={expenses} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
