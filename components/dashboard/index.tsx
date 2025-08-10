import React, { useEffect, useMemo, useState } from "react";
import BalanceCard from "../balance/BalanceCard";
import { Box } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { TelegramWebApp, ViewMode } from "../../utils/types";
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
import WelcomeScreen from "./WelcomeScreen";
import { isSameMonth } from "../../utils/isSameMonth";
import { calculateSummaryData } from "../../utils/calculateSummaryData";
import { getDashboardData } from "../../utils/getDashboardData";
import { useAllEntries } from "../../hooks/useAllEntries";

export interface TelegramUser {
  id: string;
}

const Dashboard = () => {
  const { colors, fontFamily } = useTheme();
  const router = useRouter();
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>("weekly");

  const { data: allEntries, isLoading: isAllEntriesLoading } = useAllEntries(
    tgUser?.id,
    initData || undefined
  );

  const currentMonthExpenses = useMemo(() => {
    const currentDate = new Date();

    const expenses =
      allEntries?.expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return isSameMonth(expenseDate, currentDate);
      }) || [];

    const income =
      allEntries?.income.filter((income) => {
        const incomeDate = new Date(income.date);
        return isSameMonth(incomeDate, currentDate);
      }) || [];

    const budgets =
      allEntries?.budgets.filter((budget) => {
        const budgetDate = new Date(budget.created_at);
        return isSameMonth(budgetDate, currentDate);
      }) || [];

    return { expenses, income, budgets };
  }, [allEntries]);

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

          webApp.lockOrientation?.("portrait");

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
  if (
    !allEntries ||
    (tgUser && initData && isAllEntriesLoading)
    // (tgUser && initData && isExpensesWithBudgetLoading)
  ) {
    return <LoadingSkeleton />;
  }

  // Show welcome screen if no data
  if (allEntries.expenses.length === 0 && allEntries.budgets.length === 0) {
    return <WelcomeScreen />;
  }

  // Calculate summary data from real expenses
  const { totalIncome, totalExpenses, totalBudget } =
    calculateSummaryData(currentMonthExpenses);

  // Generate real data based on expenses
  const data = getDashboardData(
    currentMonthExpenses.expenses,
    currentMonthExpenses.budgets,
    internalViewMode
  );

  const hasBudget = currentMonthExpenses.budgets.length > 0 && totalBudget > 0;

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
          width: "100%",
          maxWidth: "24rem",
          minWidth: "24rem",
          bgcolor: colors.background,
          mx: "auto", // Center the content
          px: { xs: 2, sm: 2, md: 2 }, // Consistent padding
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: 2,
            gap: 1,
          }}
        >
          {/* Balance Card */}
          {hasBudget && (
            <Box sx={{ width: "100%" }}>
              <BalanceCard
                expensesWithBudget={currentMonthExpenses.expenses}
                budgets={currentMonthExpenses.budgets}
                totalBudget={totalBudget}
              />
            </Box>
          )}

          {/* Expense Summary Card */}
          <Box sx={{ width: "100%" }}>
            <ExpenseSummaryCard
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
            />
          </Box>

          {/* Budget Overview Card */}
          <Box sx={{ width: "100%" }}>
            <ExpensesAndBudgetOverview
              data={data}
              viewMode={internalViewMode}
              onViewModeChange={setInternalViewMode}
            />
          </Box>

          {/* Recent Transactions Card */}
          <Box sx={{ width: "100%", mb: 4 }}>
            <ExpenseList allEntries={allEntries} tgUser={tgUser} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
