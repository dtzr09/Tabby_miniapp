import React, { useCallback, useEffect, useMemo, useState } from "react";
import BalanceCard from "../balance/BalanceCard";
import { Box } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Expense, TelegramWebApp, ViewMode } from "../../utils/types";
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
import { useQuery } from "@tanstack/react-query";
import GroupSwitcher from "./GroupSwitcher";
import { GroupOutlined, PersonOutlineOutlined } from "@mui/icons-material";
import GroupPersonalToggle from "./GroupPersonalToggle";
import { fetchGroups } from "../../services/group";
import { useUser } from "../../hooks/useUser";
import { getPersonalExpensesFromGroup } from "../../utils/getPersonalExpensesFromGroup";
import { fetchUserCount } from "../../services/userCount";

export interface TelegramUser {
  id: string;
}

interface Group {
  chat_id: string;
  name: string;
  telegram_id?: string;
}

const Dashboard = () => {
  const { colors, fontFamily } = useTheme();
  const router = useRouter();
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>("weekly");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupView, setIsGroupView] = useState<boolean>(true);

  // Fetch user data from database
  const { data: dbUser, isLoading: isUserLoading } = useUser(
    tgUser?.id,
    initData || undefined,
    selectedGroupId || undefined
  );

  const { data: allEntries, isLoading: isAllEntriesLoading } = useAllEntries(
    tgUser?.id,
    initData || undefined,
    selectedGroupId || undefined
  );

  const { data: groups } = useQuery({
    queryKey: ["groupsWithExpenses", tgUser?.id],
    queryFn: () => {
      if (tgUser && initData) {
        return fetchGroups(tgUser.id, initData);
      }
      return Promise.resolve(null);
    },
    enabled: !!tgUser && !!initData,
  });

  // Filter entries based on group and personal view settings
  const getPersonalFilteredExpenses = useCallback(
    (expenses: Expense[]) => {
      if (selectedGroupId && !isGroupView && dbUser?.id) {
        return getPersonalExpensesFromGroup(expenses, dbUser.id);
      }
      return expenses;
    },
    [selectedGroupId, isGroupView, dbUser?.id]
  );

  const filteredAllEntries = useMemo(() => {
    if (!allEntries) return allEntries;
    return {
      ...allEntries,
      expenses: getPersonalFilteredExpenses(allEntries.expenses),
    };
  }, [allEntries, getPersonalFilteredExpenses]);

  const currentMonthExpenses = useMemo(() => {
    if (!filteredAllEntries) return { expenses: [], income: [], budgets: [] };

    const currentDate = new Date();
    const isCurrentMonth = (date: string) =>
      isSameMonth(new Date(date), currentDate);

    return {
      expenses: filteredAllEntries.expenses.filter((expense) =>
        isCurrentMonth(expense.date)
      ),
      income: filteredAllEntries.income.filter((income) =>
        isCurrentMonth(income.date)
      ),
      budgets: filteredAllEntries.budgets.filter((budget) =>
        isCurrentMonth(budget.created_at)
      ),
    };
  }, [filteredAllEntries]);

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

  const { data: userCountData } = useQuery({
    queryKey: ["userCount", selectedGroupId],
    queryFn: () => {
      if (tgUser?.id && initData && selectedGroupId) {
        return fetchUserCount(tgUser.id, initData, selectedGroupId);
      }
      return Promise.resolve(1);
    },
    enabled: !!(selectedGroupId && !isGroupView && tgUser?.id && initData),
  });

  const userCount = userCountData || 1;

  // Only show loading when we have user data and are actually fetching
  if (
    !filteredAllEntries ||
    (tgUser && initData && (isAllEntriesLoading || isUserLoading))
  ) {
    return <LoadingSkeleton />;
  }

  // Derived values
  const hasData =
    filteredAllEntries?.expenses.length > 0 ||
    filteredAllEntries?.budgets.length > 0;
  const hasGroups = groups && groups.length > 0;
  const summaryData = calculateSummaryData(currentMonthExpenses);
  const dashboardData = getDashboardData(
    currentMonthExpenses.expenses,
    currentMonthExpenses.budgets,
    internalViewMode
  );
  const hasBudget =
    currentMonthExpenses.budgets.length > 0 && summaryData.totalBudget > 0;

  const handleViewToggle = () => setIsGroupView(!isGroupView);

  // Show welcome screen if no data and no groups
  if (!hasData && !hasGroups) {
    return <WelcomeScreen />;
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
            gap: 1.5,
          }}
        >
          {/* Group Switcher and Toggle - only show when has groups */}
          {hasGroups && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                width: "100%",
              }}
            >
              <GroupSwitcher
                groups={[
                  {
                    id: null,
                    name: "Personal",
                    icon: <PersonOutlineOutlined sx={{ fontSize: "1.2rem" }} />,
                  },
                  ...(groups?.map((group: Group) => ({
                    id: group.chat_id,
                    name: group.name,
                    icon: <GroupOutlined sx={{ fontSize: "1.2rem" }} />,
                  })) || []),
                ]}
                selectedGroupId={selectedGroupId}
                setSelectedGroupId={setSelectedGroupId}
              />
              {selectedGroupId !== null && (
                <GroupPersonalToggle
                  isGroup={isGroupView}
                  onToggle={handleViewToggle}
                />
              )}
            </Box>
          )}

          {/* Balance Card */}
          {hasBudget && (
            <Box sx={{ width: "100%" }}>
              <BalanceCard
                expensesWithBudget={currentMonthExpenses.expenses}
                budgets={currentMonthExpenses.budgets}
                totalBudget={summaryData.totalBudget}
                selectedGroupId={selectedGroupId}
                isGroupView={isGroupView}
                userCount={userCount}
              />
            </Box>
          )}

          {/* Expense Summary Card */}
          <Box sx={{ width: "100%" }}>
            <ExpenseSummaryCard
              totalIncome={summaryData.totalIncome}
              totalExpenses={summaryData.totalExpenses}
            />
          </Box>

          {/* Budget Overview Card */}
          <Box sx={{ width: "100%" }}>
            <ExpensesAndBudgetOverview
              data={dashboardData}
              viewMode={internalViewMode}
              onViewModeChange={setInternalViewMode}
            />
          </Box>

          {/* Recent Transactions Card */}
          <Box sx={{ width: "100%", mb: 4 }}>
            <ExpenseList
              allEntries={filteredAllEntries}
              tgUser={tgUser}
              isGroupView={isGroupView}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
