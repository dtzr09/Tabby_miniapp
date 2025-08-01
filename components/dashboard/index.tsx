import React, { useEffect, useState } from "react";
import BalanceCard from "../balance/BalanceCard";
import { Box } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { getDailyBreakdown } from "../../utils/getDailyBreakdown";
import { getFilteredExpenses } from "../../utils/getFilteredExpenses";
import { getCategoryData } from "../../utils/getCategoryData";
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
import ExpenseList from "../expenses/expenseList/ExpenseList";
import ExpensesAndBudgetOverview from "../expenses/expensesOverview/ExpensesAndBudgetOverview";
import { fetchExpensesAndBudgets } from "../../services/expenses";
import { useQuery } from "@tanstack/react-query";
import WelcomeScreen from "./WelcomeScreen";

export interface TelegramUser {
  id: string;
}

interface ExpensesAndBudgets {
  expenses: Expense[];
  budgets: Budget[];
}

const Dashboard = () => {
  const { colors, fontFamily } = useTheme();
  const router = useRouter();
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>("weekly");

  const { data: expensesAndBudgets, isLoading: isExpensesLoading } =
    useQuery<ExpensesAndBudgets>({
      queryKey: ["expensesAndBudgets", tgUser?.id],
      queryFn: () => {
        if (tgUser && initData) {
          return fetchExpensesAndBudgets(tgUser.id, initData);
        }
        return Promise.resolve({ expenses: [], budgets: [] });
      },
      enabled: !!tgUser && !!initData,
      staleTime: 30000, // Data stays fresh for 30 seconds
      gcTime: 300000, // Cache for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeApp = async () => {
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      if (webApp && webApp.initData) {
        try {
          init();

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
            setTgUser(user);
            setInitData(initData);
          }
        } catch (err) {
          console.error("❌ Telegram Init Failed:", err);
        }
      } else {
        console.log("⏳ Waiting for Telegram WebApp to initialize...");
        setTimeout(initializeApp, 100);
      }
    };

    initializeApp();
  }, [router]);

  // Only show loading when we have user data and are actually fetching
  if (!expensesAndBudgets || (tgUser && initData && isExpensesLoading)) {
    return <LoadingSkeleton />;
  }

  // Show welcome screen if no data
  if (expensesAndBudgets.expenses.length === 0 && expensesAndBudgets.budgets.length === 0) {
    return <WelcomeScreen />;
  }

  // Use empty arrays as fallbacks when data is undefined
  const expenses = expensesAndBudgets.expenses;
  const budgets = expensesAndBudgets.budgets;

  // Calculate summary data from real expenses
  const totalIncome = expenses
    .filter((exp: Expense) => exp.is_income)
    .reduce((sum: number, exp: Expense) => sum + (exp.amount || 0), 0);

  const totalExpenses = expenses
    .filter((exp: Expense) => !exp.is_income)
    .reduce((sum: number, exp: Expense) => sum + Math.abs(exp.amount || 0), 0);

  // Calculate total budget from budgets data
  const totalBudget = budgets.reduce(
    (sum: number, budget: Budget) => sum + (budget.amount || 0),
    0
  );

  // Calculate remaining balance as total budget minus expenses
  const totalBalance = totalBudget - totalExpenses;

  // Generate real data based on expenses
  const getRealData = (period: ViewMode) => {
    const filteredExpenses = getFilteredExpenses(expenses, period);
    const totalExpenses = filteredExpenses.reduce(
      (sum: number, exp: Expense) => sum + Math.abs(exp.amount || 0),
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
      num_of_budgets:
        budgets.filter(
          (budget: Budget) =>
            !budget.category.name.toLowerCase().includes("flexible")
        ).length || 0,
    };
  };

  const data = getRealData(internalViewMode);

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
          <Box sx={{ width: "100%", mb: 4 }}>
            <ExpenseList initData={initData} tgUser={tgUser} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
