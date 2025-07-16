import React, { useEffect, useState } from "react";
import ExpenseSummaryCard from "../cards/ExpenseSummaryCard";
import ExpenseList from "../cards/ExpenseList";
import SwipeableBudgetCard from "../cards/SwipeableBudgetCard";
import BalanceCard from "../cards/BalanceCard";
import { Box, Typography } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";

// interface Budget {
//   id: number;
//   amount: number;
//   created_at: string;
//   updated_at: string;
//   category: {
//     id: number;
//     name: string;
//   };
// }

interface Expense {
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
  // const [budgets, setBudgets] = useState<Budget[]>([]);
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
          hash,
          initData,
        });

        // Fetch expenses
        fetch(`/api/expenses?${params.toString()}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            const expensesArray = Array.isArray(data) ? data : [];
            setExpenses(expensesArray);
          })
          .catch((error) => {
            console.error("❌ Error fetching expenses:", error);
            setExpenses([]);
          });

        // Fetch budgets
        fetch(`/api/budgets?${params.toString()}`)
          .then((res) => res.json())
          .then((data) => {
            console.log("budgets", data);
            // const budgetsArray = Array.isArray(data) ? data : [];
            // setBudgets(budgetsArray);
          })
          .catch((error) => {
            console.error("❌ Error fetching budgets:", error);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Calculate summary data from real expenses
  const totalIncome = expenses
    .filter((exp) => exp.is_income)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalExpenses = expenses
    .filter((exp) => !exp.is_income)
    .reduce((sum, exp) => sum + Math.abs(exp.amount), 0);

  const totalBalance = totalIncome - totalExpenses;

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
            px: { xs: 4, sm: 1, md: 0 },
            gap: 2,
          }}
        >
          {/* Summary Card (now at the top) */}

          {/* Balance Card */}
          <Box sx={{ width: "100%" }}>
            <BalanceCard
              availableBalance={totalBalance}
              daysRemaining={30 - new Date().getDate()}
              dailyBudget={totalBalance / (30 - new Date().getDate())}
              spentAmount={totalExpenses}
              totalBudget={totalIncome}
            />
          </Box>

          <ExpenseSummaryCard
            // totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
          />

          {/* Budget Overview Card */}
          <Box sx={{ width: "100%" }}>
            <SwipeableBudgetCard
            // expenses={expenses}
            // budgets={budgets}
            // onCategoryAction={(categoryId: string) =>
            //   console.log("Category action:", categoryId)
            // }
            />
          </Box>

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
