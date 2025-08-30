import { Box, Typography, LinearProgress, alpha } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { getCategoryData } from "../../utils/getCategoryData";
import { Budget, Expense } from "../../utils/types";
import { getProgressColor } from "../balance/BalanceCard";

interface BudgetBreakdownProps {
  expenses: Expense[];
  budgets: Budget[];
  viewType: "weekly" | "monthly";
  selectedGroupId?: string | null;
  isGroupView?: boolean;
  userCount?: number;
}

export default function BudgetBreakdown({
  expenses,
  budgets,
  viewType,
  selectedGroupId,
  isGroupView,
  userCount,
}: BudgetBreakdownProps) {
  const { colors } = useTheme();

  // Get category data with icons and colors
  const categories = getCategoryData(expenses, budgets, viewType);

  // Calculate adjusted budgets and spending, and sort flexible to bottom
  const adjustedCategories = categories
    .map((category) => {
      let adjustedBudget =
        viewType === "weekly" ? category.budget / 4 : category.budget;
      const adjustedSpent =
        viewType === "weekly" ? category.spent : category.spent;

      // Divide budget by user count when in group and not group view
      if (selectedGroupId && !isGroupView && userCount && userCount > 1) {
        adjustedBudget = adjustedBudget / userCount;
      }

      return {
        ...category,
        budget: adjustedBudget,
        spent: adjustedSpent,
        isFlexible: category.name.toLowerCase().includes("flexible"),
      };
    })
    .filter((category) => category.budget > 0)
    .sort((a, b) => {
      if (a.isFlexible === b.isFlexible) return 0;
      return a.isFlexible ? 1 : -1;
    });

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {adjustedCategories.map((category) => {
          const progress = (category.spent / category.budget) * 100;
          const progressColor = getProgressColor(progress);
          const remaining = category.budget - category.spent;
          const adjustedRemaining = remaining < 0 ? 0 : remaining;

          return (
            <Box key={category.id}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: alpha(category.color, 0.2),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: category.color,
                      fontSize: "0.8rem", // Make the icon/emoji smaller
                    }}
                  >
                    {category.icon}
                  </Box>
                  <Typography
                    sx={{
                      color: colors.text,
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    {category.name.replace("&", "&amp;")}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: colors.text,
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  ${adjustedRemaining.toFixed(2)} left /{" "}
                  <span style={{ color: colors.textSecondary }}>
                    ${category.budget.toFixed(0)}
                  </span>
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(progress, 100)}
                sx={{
                  height: 3,
                  borderRadius: 3,
                  bgcolor: alpha(category.color, 0.1),
                  "& .MuiLinearProgress-bar": {
                    bgcolor: progressColor,
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
