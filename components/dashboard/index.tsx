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

const Dashboard = () => {
  const { colors, fontFamily } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // useEffect(() => {
  //   if (typeof window === "undefined") return;

  //   const initializeTelegram = () => {
  //     const webApp = window.Telegram?.WebApp as TelegramWebApp;
  //     if (webApp && webApp.initData) {
  //       try {
  //         init();

  //         settingsButton.mount();
  //         settingsButton.show();
  //         settingsButton.onClick(() => {
  //           router.push("/settings");
  //         });

  //         if (backButton.isMounted()) {
  //           backButton.hide();
  //         }
  //         if (mainButton.isMounted()) {
  //           mainButton.setParams({
  //             isVisible: false,
  //           });
  //         }

  //         console.log("✅ Telegram WebApp initialized successfully");
  //       } catch (error) {
  //         console.error("❌ Error initializing Telegram WebApp:", error);
  //       }
  //     } else {
  //       console.log("⏳ Waiting for Telegram WebApp to initialize...");
  //       // Retry after a short delay
  //       setTimeout(initializeTelegram, 100);
  //     }
  //   };

  //   initializeTelegram();
  // }, [router]);

  // useEffect(() => {
  //   if (
  //     typeof window !== "undefined" &&
  //     window.Telegram &&
  //     typeof window.Telegram.WebApp !== "undefined"
  //   ) {
  //     const tg = window.Telegram.WebApp as {
  //       initDataUnsafe?: { user?: { id: string }; hash?: string };
  //       initData?: string;
  //     };
  //     const user = tg.initDataUnsafe?.user;
  //     const hash = tg.initDataUnsafe?.hash;
  //     const initData = tg.initData;

  //     if (user && hash && initData) {
  //       const params = new URLSearchParams({
  //         telegram_id: user.id,
  //         initData,
  //       });

  //       const fetchExpenses = fetch(`/api/expenses?${params.toString()}`)
  //         .then((res) => {
  //           if (!res.ok) {
  //             return res.text().then((text) => {
  //               console.error("❌ API Error response:", text);
  //               throw new Error(
  //                 `HTTP error! status: ${res.status}, body: ${text}`
  //               );
  //             });
  //           }
  //           return res.json();
  //         })
  //         .then((data) => {
  //           const expensesArray = Array.isArray(data) ? data : [];
  //           setExpenses(expensesArray);
  //         });

  //       const fetchBudgets = fetch(`/api/budgets?${params.toString()}`)
  //         .then((res) => {
  //           if (!res.ok) {
  //             return res.text().then((text) => {
  //               console.error("❌ Budgets API Error response:", text);
  //               throw new Error(
  //                 `HTTP error! status: ${res.status}, body: ${text}`
  //               );
  //             });
  //           }
  //           return res.json();
  //         })
  //         .then((data) => {
  //           const budgetsArray = Array.isArray(data) ? data : [];
  //           setBudgets(budgetsArray);
  //         });

  //       Promise.allSettled([fetchExpenses, fetchBudgets]).finally(() => {
  //         setLoading(false);
  //       });
  //     } else {
  //       setLoading(false);
  //     }
  //   } else {
  //     setLoading(false);
  //   }
  // }, []);

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
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Skeleton
          variant="rectangular"
          width={300}
          height={100}
          sx={{ borderRadius: 2 }}
        />
        <Skeleton
          variant="rectangular"
          width={300}
          height={100}
          sx={{ borderRadius: 2 }}
        />
        <Skeleton
          variant="rectangular"
          width={300}
          height={200}
          sx={{ borderRadius: 2 }}
        />
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
