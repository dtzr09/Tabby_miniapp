import React, { useEffect, useState } from "react";
import ExpenseList from "../expenseList/ExpenseList";
import BalanceCard from "../balance/BalanceCard";
import { Box, Skeleton } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { getDailyBreakdown } from "../../utils/getDailyBreakdown";
import { getFilteredExpenses } from "../../utils/getFilteredExpenses";
import { getCategoryData } from "../../utils/getCategoryData";
import ExpensesAndBudgetOverview from "../expensesOverview/ExpensesAndBudgetOverview";
import { Budget, Expense, TelegramWebApp, ViewMode } from "../../utils/types";
import {
  backButton,
  init,
  mainButton,
  settingsButton,
} from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import ExpenseSummaryCard from "../currentExpenses/ExpenseSummaryCard";
import LoadingSkeleton from "./LoadingSkeleton";

const Dashboard = () => {
  const { colors, fontFamily } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const [budgetsLoaded, setBudgetsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeApp = async () => {
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      if (webApp && webApp.initData) {
        try {
          init(); // Your WebApp init

          settingsButton.mount();
          settingsButton.show();
          settingsButton.onClick(() => {
            router.push("/settings");
          });

          if (backButton.isMounted()) backButton.hide();
          if (mainButton.isMounted())
            mainButton.setParams({ isVisible: false });

          const user = webApp.initDataUnsafe?.user;
          const hash = webApp.initDataUnsafe?.hash;
          const initData = webApp.initData;

          if (user && hash && initData) {
            const params = new URLSearchParams({
              telegram_id: user.id,
              initData,
            });

            // Fetch both expenses and budgets
            const fetchExpenses = fetch(`/api/expenses?${params.toString()}`)
              .then((res) => {
                if (!res.ok) {
                  return res.text().then((text) => {
                    console.error("❌ Expenses API Error:", text);
                    throw new Error(`Expenses error ${res.status}: ${text}`);
                  });
                }
                return res.json();
              })
              .then((data) => {
                setExpenses(Array.isArray(data) ? data : []);
                setExpensesLoaded(true);
              });

            const fetchBudgets = fetch(`/api/budgets?${params.toString()}`)
              .then((res) => {
                if (!res.ok) {
                  return res.text().then((text) => {
                    console.error("❌ Budgets API Error:", text);
                    throw new Error(`Budgets error ${res.status}: ${text}`);
                  });
                }
                return res.json();
              })
              .then((data) => {
                setBudgets(Array.isArray(data) ? data : []);
                setBudgetsLoaded(true);
              });

            await Promise.allSettled([fetchExpenses, fetchBudgets]);
          }
        } catch (err) {
          console.error("❌ Telegram Init Failed:", err);
        } finally {
          setLoading(false); // ✅ Only stop loading after everything above is complete
        }
      } else {
        console.log("⏳ Waiting for Telegram WebApp to initialize...");
        setTimeout(initializeApp, 100);
      }
    };

    initializeApp();
  }, [router]);

  useEffect(() => {
    if (expensesLoaded && budgetsLoaded) {
      setLoading(false);
    }
  }, [expensesLoaded, budgetsLoaded]);

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

  const [internalViewMode, setInternalViewMode] = useState<ViewMode>("weekly");

  // Generate real data based on expenses
  const getRealData = (period: ViewMode) => {
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
    return <LoadingSkeleton />;
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
          {budgets.length > 0 && totalBudget > 0 && (
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
