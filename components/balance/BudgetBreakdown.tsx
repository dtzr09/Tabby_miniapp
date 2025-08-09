import { Box, Typography, LinearProgress, alpha } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { getCategoryData } from "../../utils/getCategoryData";
import { Budget, Expense } from "../../utils/types";
import { getProgressColor } from "./BalanceCard";

interface BudgetBreakdownProps {
  expenses: Expense[];
  budgets: Budget[];
  viewType: "weekly" | "monthly";
}

export default function BudgetBreakdown({
  expenses,
  budgets,
  viewType,
}: BudgetBreakdownProps) {
  const { colors } = useTheme();

  // Get category data with icons and colors
  const categories = getCategoryData(expenses, budgets, viewType);

  // Calculate adjusted budgets and spending
  const adjustedCategories = categories.map((category) => {
    const adjustedBudget =
      viewType === "weekly" ? category.budget / 4 : category.budget;
    const adjustedSpent =
      viewType === "weekly" ? category.spent : category.spent;
    return {
      ...category,
      budget: adjustedBudget,
      spent: adjustedSpent,
    };
  });

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {adjustedCategories.map((category) => {
          const progress = (category.spent / category.budget) * 100;
          const progressColor = getProgressColor(progress);
          const remaining = category.budget - category.spent;

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
                      bgcolor: alpha(category.color, 0.1),
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
                  ${remaining.toFixed(2)} /{" "}
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
