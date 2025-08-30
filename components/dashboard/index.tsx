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
import { fetchPreferences } from "../../services/preferences";
import { fetchCategories } from "../../services/categories";
import { fetchUser } from "../../services/users";
import { AppLayout } from "../AppLayout";
import {
  saveNavigationState,
  loadNavigationState,
} from "../../utils/navigationState";

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
    initData,
    selectedGroupId || undefined
  );

  const { data: allEntries, isLoading: isAllEntriesLoading } = useAllEntries(
    tgUser?.id,
    initData,
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

  // Prefetch preferences, categories, and user data when dashboard loads
  useQuery({
    queryKey: ["dashboardConfig", tgUser?.id, selectedGroupId],
    queryFn: async () => {
      if (tgUser && initData) {
        const [preferences, categories, user] = await Promise.all([
          fetchPreferences(tgUser.id, initData, selectedGroupId),
          fetchCategories(tgUser.id, initData, selectedGroupId),
          fetchUser(tgUser.id, initData, selectedGroupId || undefined),
        ]);
        
        return {
          preferences,
          categories,
          user,
        };
      }
      return Promise.resolve(null);
    },
    enabled: !!tgUser && !!initData,
    staleTime: 10 * 60 * 1000, // 10 minutes for preferences, categories are fairly static
    gcTime: 30 * 60 * 1000, // 30 minutes
    select: (data) => {
      // Also cache individual items for components that query them directly
      if (data) {
        // Cache preferences separately
        const preferencesQueryKey = ["preferences", tgUser?.id, selectedGroupId];
        queryClient.setQueryData(preferencesQueryKey, data.preferences);
        
        // Cache categories separately  
        const categoriesQueryKey = ["categories", tgUser?.id, selectedGroupId];
        queryClient.setQueryData(categoriesQueryKey, data.categories);
        
        // Cache user data separately
        const userQueryKey = ["user", tgUser?.id, selectedGroupId];
        queryClient.setQueryData(userQueryKey, data.user);
      }
      return data;
    },
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

  // Optimized initialization using the useTelegramWebApp hook
  useEffect(() => {
    if (!isReady || !webApp) return;

    try {
      settingsButton.mount();
      settingsButton.show();
      settingsButton.onClick(() => {
        onViewChange("settings");
      });

      if (mainButton.isMounted()) mainButton.setParams({ isVisible: false });

      // Aggressively unmount back button for dashboard
      try {
        if (backButton.isMounted()) {
          backButton.hide();
          backButton.unmount();
        }
      } catch (backButtonError) {
        console.warn("Failed to unmount back button:", backButtonError);
      }

      webApp.lockOrientation?.("portrait");

      if (user && telegramInitData) {
        setTgUser(user);
        setInitData(telegramInitData);

        // Load navigation state from localStorage
        const savedState = loadNavigationState();
        if (savedState) {
          setSelectedGroupId(savedState.selectedGroupId);
          setIsGroupView(savedState.isGroupView);
        } else if (user.id) {
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

  const handleViewToggle = () => {
    const newIsGroupView = !isGroupView;
    setIsGroupView(newIsGroupView);

    // Save state to localStorage
    saveNavigationState({
      selectedGroupId,
      isGroupView: newIsGroupView,
    });
  };

  // Show welcome screen if no data and no groups
  if (!hasData && !hasGroups) {
    return <WelcomeScreen />;
  }

  return (
    <AppLayout title={"Dashboard"}>
      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          bgcolor: colors.background,
          color: colors.text,
          fontFamily: fontFamily,
          display: "flex",
          justifyContent: "center",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "min(24rem, 100%)",
            bgcolor: colors.background,
            overflow: "hidden",
            boxSizing: "border-box",
            px: 0, // Remove padding since AppLayout handles it
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mt: 2,
              gap: 1.5,
              width: "100%",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            {/* Group Switcher and Toggle - only show when has groups */}
            {hasGroups && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <GroupSwitcher
                    groups={[
                      {
                        id: tgUser?.id?.toString() || null,
                        name: "Personal",
                        icon: (
                          <PersonOutlineOutlined sx={{ fontSize: "1.2rem" }} />
                        ),
                      },
                      ...(groups?.map((group: Group) => ({
                        id: group.chat_id,
                        name: group.name,
                        icon: <GroupOutlined sx={{ fontSize: "1.2rem" }} />,
                      })) || []),
                    ]}
                    selectedGroupId={selectedGroupId}
                    setSelectedGroupId={(groupId: string | null) => {
                      setSelectedGroupId(groupId);
                      // Save state to localStorage
                      saveNavigationState({
                        selectedGroupId: groupId,
                        isGroupView,
                      });
                    }}
                    userId={tgUser?.id}
                    initData={initData || undefined}
                  />
                </Box>

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
    </AppLayout>
  );
};

export default Dashboard;
