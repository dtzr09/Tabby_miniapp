import React, { useCallback, useEffect, useMemo, useState } from "react";
import BalanceCard from "../balance/BalanceCard";
import { Box } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Expense, ViewMode } from "../../utils/types";
import { backButton, mainButton, settingsButton } from "@telegram-apps/sdk";
import ExpenseSummaryCard from "../currentExpenses/ExpenseSummaryCard";
import LoadingSkeleton from "./LoadingSkeleton";
import ExpenseList from "../expenses/expenseList/ExpenseList";
import ExpensesAndBudgetOverview from "../expenses/expensesOverview/ExpensesAndBudgetOverview";
import WelcomeScreen from "./WelcomeScreen";
import { isSameMonth } from "../../utils/isSameMonth";
import { calculateSummaryData } from "../../utils/calculateSummaryData";
import { getDashboardData } from "../../utils/getDashboardData";
import { useAllEntries } from "../../hooks/useAllEntries";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import GroupSwitcher from "./GroupSwitcher";
import { GroupOutlined, PersonOutlineOutlined } from "@mui/icons-material";
import GroupPersonalToggle from "./GroupPersonalToggle";
import { fetchGroups } from "../../services/group";
import { useUser } from "../../hooks/useUser";
import { getPersonalExpensesFromGroup } from "../../utils/getPersonalExpensesFromGroup";
import { fetchUserCount } from "../../services/userCount";
import { useTelegramWebApp } from "../../hooks/useTelegramWebApp";
import { fetchCategories } from "../../services/categories";
import { fetchAllEntries } from "../../services/allEntries";
import { fetchPreferences } from "../../services/preferences";

export interface TelegramUser {
  id: string;
}

interface Group {
  chat_id: string;
  name: string;
  telegram_id?: string;
}

interface DashboardProps {
  onViewChange: (view: "dashboard" | "settings") => void;
}

const Dashboard = ({ onViewChange }: DashboardProps) => {
  const { colors, fontFamily } = useTheme();
  const queryClient = useQueryClient();
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string | null>(null);

  // Use optimized Telegram WebApp hook
  const {
    webApp,
    user,
    initData: telegramInitData,
    isReady,
  } = useTelegramWebApp();
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

  // Comprehensive data prefetching for all groups when groups are loaded
  useEffect(() => {
    if (groups && tgUser && initData) {
      const prefetchPromises: Promise<unknown>[] = [];

      groups.forEach((group: Group) => {
        // Prefetch allEntries for each group
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ["allEntries", tgUser.id, group.chat_id],
            queryFn: () => fetchAllEntries(tgUser.id, initData, group.chat_id),
            staleTime: 60000,
          })
        );

        // Prefetch categories for each group (for settings)
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ["categories", tgUser.id, group.chat_id],
            queryFn: () => fetchCategories(tgUser.id, initData, group.chat_id),
            staleTime: 300000, // 5 minutes
          })
        );

        // Prefetch user count for each group
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ["userCount", group.chat_id],
            queryFn: () => fetchUserCount(tgUser.id, initData, group.chat_id),
            staleTime: 300000, // 5 minutes
          })
        );

        // Prefetch preferences for each group (for settings)
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ["preferences", tgUser.id, group.chat_id],
            queryFn: () => fetchPreferences(tgUser.id, initData, group.chat_id),
            staleTime: 600000, // 10 minutes
          })
        );
      });

      // Also prefetch personal data (null chat_id)
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: ["allEntries", tgUser.id, null],
          queryFn: () => fetchAllEntries(tgUser.id, initData, null),
          staleTime: 60000,
        })
      );

      // Prefetch personal categories (for settings)
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: ["categories", tgUser.id, null],
          queryFn: () => fetchCategories(tgUser.id, initData, null),
          staleTime: 300000, // 5 minutes
        })
      );

      // Prefetch personal preferences (for settings)
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: ["preferences", tgUser.id, null],
          queryFn: () => fetchPreferences(tgUser.id, initData, null),
          staleTime: 600000, // 10 minutes
        })
      );

      // Execute all prefetch operations
      Promise.allSettled(prefetchPromises).then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`📦 Prefetch completed: ${successful} successful, ${failed} failed`);
      });
    }
  }, [groups, tgUser, initData, queryClient]);

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

  // Optimized initialization using the useTelegramWebApp hook
  useEffect(() => {
    if (!isReady || !webApp) return;

    try {
      settingsButton.mount();
      settingsButton.show();
      settingsButton.onClick(() => {
        onViewChange("settings");
      });

      if (backButton.isMounted()) backButton.hide();
      if (mainButton.isMounted()) mainButton.setParams({ isVisible: false });

      webApp.lockOrientation?.("portrait");

      if (user && telegramInitData) {
        setTgUser(user);
        setInitData(telegramInitData);
        if (user.id) {
          setSelectedGroupId(user.id.toString());
        }
      }
    } catch (err) {
      console.error("❌ Telegram Setup Failed:", err);
    }
  }, [isReady, webApp, user, telegramInitData, onViewChange]);

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
        display: "flex",
        justifyContent: "center",
        mt: 4,
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
                    id: tgUser?.id?.toString() || null,
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
                userId={tgUser?.id}
                initData={initData || undefined}
              />

              {selectedGroupId !== null &&
                selectedGroupId !== tgUser?.id?.toString() && (
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
