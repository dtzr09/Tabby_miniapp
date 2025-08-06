import { Box, Typography } from "@mui/material";
import React, { useMemo } from "react";
import { useTheme } from "../../src/contexts/ThemeContext";
import { getProgressColor } from "../balance/BalanceCard";

interface BudgetOverviewCardProps {
  viewMode?: "daily" | "weekly" | "monthly";
  onViewModeChange?: (mode: "daily" | "weekly" | "monthly") => void;
  data: {
    totalExpenses: number;
    dateRange: string;
    dailyExpenses: { day: string; amount: number }[];
    categories: {
      id: string;
      name: string;
      icon: React.JSX.Element;
      budget: number;
      spent: number;
      color: string;
    }[];
    num_of_budgets: number;
  };
}

const BudgetOverviewCard = (props: BudgetOverviewCardProps) => {
  const { colors } = useTheme();

  // Calculate actual days and weeks in current month
  const getCurrentMonthInfo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Get the last day of the current month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Calculate weeks in month (including partial weeks)
    const firstDay = new Date(year, month, 1);

    // Get the day of week for first and last day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();

    // Calculate total weeks (including partial weeks at start and end)
    const weeksInMonth = Math.ceil((daysInMonth + firstDayOfWeek) / 7);

    return {
      daysInMonth,
      weeksInMonth,
      currentDay: now.getDate(),
      currentWeek: Math.ceil((now.getDate() + firstDayOfWeek) / 7),
    };
  };

  // Calculate adjusted budgets based on view mode
  const adjustedCategories = useMemo(() => {
    const monthInfo = getCurrentMonthInfo();

    if (!props.viewMode)
      return props.data.categories.filter(
        (category) => !category.name.toLowerCase().includes("flexible")
      );

    return props.data.categories
      .filter((category) => !category.name.toLowerCase().includes("flexible"))
      .map((category) => {
        let adjustedBudget = category.budget;
        const adjustedSpent = category.spent;

        switch (props.viewMode) {
          case "daily":
            // For daily view, divide monthly budget by actual days in month
            adjustedBudget = category.budget / monthInfo.daysInMonth;
            break;
          case "weekly":
            // For weekly view, divide monthly budget by actual weeks in month
            adjustedBudget = category.budget / 4;
            break;
          case "monthly":
            // For monthly view, use the original budget
            adjustedBudget = category.budget;
            break;
        }

        return {
          ...category,
          budget: adjustedBudget,
          spent: adjustedSpent,
        };
      });
  }, [props.data.categories, props.viewMode]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: props.data.num_of_budgets > 0 ? 2 : 0,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1.2rem",
              color: colors.text,
            }}
          >
            Budget {props.viewMode && `(${props.viewMode})`}
          </Typography>
          {props.data.num_of_budgets > 0 && (
            <Typography
              sx={{
                fontSize: "0.9rem",
                color: colors.textSecondary,
              }}
            >
              {props.data.num_of_budgets} in total
            </Typography>
          )}
        </Box>
      </Box>
      {adjustedCategories.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 4,
            color: colors.textSecondary,
          }}
        >
          <Typography variant="body2">
            No budgets or expenses found. Add some expenses to see your budget
            overview!
          </Typography>
        </Box>
      )}

      {/* Budget Categories */}
      {adjustedCategories.length > 0 && (
        <>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              overflowX: "scroll",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {adjustedCategories.map((category) => {
              if (category.budget === 0 || category.spent === undefined) {
                return null;
              }
              const progress = (category.spent / category.budget) * 100;
              const progressColor = getProgressColor(progress);
              return (
                <Box
                  key={category.id}
                  sx={{
                    minWidth: 120,
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: colors.surface,
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: `conic-gradient(${progressColor} ${
                        progress * 3.6
                      }deg, ${colors.surface} 0deg)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 45,
                        height: 45,
                        borderRadius: "50%",
                        backgroundColor: colors.card,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box sx={{ color: category.color, fontSize: 20 }}>
                        {category.icon}
                      </Box>
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: colors.text,
                      textAlign: "center",
                    }}
                  >
                    ${category.spent.toFixed(2)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: colors.textSecondary,
                      textAlign: "center",
                      opacity: 0.7,
                      mb: 1,
                    }}
                  >
                    {`of $${category.budget.toFixed(2)}`}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      color: colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    {category.name}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </>
  );
};

export default BudgetOverviewCard;
