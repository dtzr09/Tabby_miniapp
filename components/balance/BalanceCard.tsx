import {
  Card,
  CardContent,
  Typography,
  Box,
  alpha,
  LinearProgress,
  IconButton,
  Collapse,
  Button,
} from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Budget, Expense } from "../../utils/types";
import { useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import BudgetBreakdown from "./BudgetBreakdown";

interface BalanceCardProps {
  expensesWithBudget: Expense[];
  budgets: Budget[];
  totalBudget: number;
}

type ViewType = "weekly" | "monthly";

// Determine progress bar color based on usage percentage
export const getProgressColor = (percentage: number) => {
  if (percentage < 25) return "#4CAF50"; // Green
  if (percentage < 50) return "#FFC107"; // Yellow
  if (percentage < 75) return "#FF9800"; // Orange
  return "#F44336"; // Red
};

export default function BalanceCard({
  expensesWithBudget,
  budgets,
  totalBudget,
}: BalanceCardProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewType, setViewType] = useState<ViewType>("monthly");

  const toggleView = () => {
    setViewType(viewType === "weekly" ? "monthly" : "weekly");
  };

  const daysRemaining =
    viewType === "weekly"
      ? 7 - new Date().getDay() || 7 // If Sunday (0), show 7 days remaining
      : new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0
        ).getDate() - new Date().getDate();

  const hasBudget = totalBudget > 0;

  // Get the start of the current week/month
  const getStartDate = () => {
    const today = new Date();
    if (viewType === "weekly") {
      const dayOfWeek = today.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() - adjustedDay + 1);
      monday.setHours(0, 0, 0, 0);
      return monday;
    } else {
      return new Date(today.getFullYear(), today.getMonth(), 1);
    }
  };

  // Calculate expenses for current period
  const periodExpenses = expensesWithBudget.reduce((sum, exp) => {
    const expDate = new Date(exp.date);
    const startDate = getStartDate();
    if (expDate >= startDate) {
      return sum + (exp.amount || 0);
    }
    return sum;
  }, 0);

  const weeklyBudget = totalBudget / 4;
  const currentBudget = viewType === "weekly" ? weeklyBudget : totalBudget;
  const currentExpenses =
    viewType === "weekly" ? periodExpenses : periodExpenses;
  const availableBalance = currentBudget - currentExpenses;

  // Calculate budget usage percentage based on current period
  const usagePercentage = hasBudget
    ? (currentExpenses / currentBudget) * 100
    : 0;
  const dailyBudget = availableBalance / daysRemaining;

  // Group expenses by category for current period
  // const categoryExpenses = expensesWithBudget.reduce((acc, exp) => {
  //   const expDate = new Date(exp.date);
  //   const startDate = getStartDate();

  //   if (expDate >= startDate) {
  //     const categoryName = exp.category?.name || "Uncategorized";
  //     if (!acc[categoryName]) {
  //       acc[categoryName] = {
  //         total: 0,
  //         budget:
  //           viewType === "weekly" ? (totalBudget * 0.3) / 4 : totalBudget * 0.3,
  //         color: getProgressColor(0), // Placeholder, will be updated by BudgetBreakdown
  //       };
  //     }
  //     acc[categoryName].total += exp.amount || 0;
  //   }
  //   return acc;
  // }, {} as Record<string, { total: number; budget: number; color: string }>);

  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: colors.card,
        boxShadow: 0,
        border: `1px solid ${colors.border}`,
      }}
    >
      <CardContent sx={{ px: 3, pb: "4px !important" }}>
        {" "}
        {/* Override default CardContent padding */}
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography
              sx={{
                fontSize: "0.9rem",
                color: colors.textSecondary,
                fontWeight: 500,
              }}
            >
              Remaining Balance
            </Typography>
            <Button
              onClick={toggleView}
              size="small"
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                color: colors.textSecondary,
                bgcolor: alpha(colors.text, 0.05),
                borderRadius: 3,
                minWidth: 0,
                px: 1,
                py: 0.25,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${alpha(colors.text, 0.15)}`,
                "&:hover": {
                  border: `1px solid ${alpha(colors.text, 0.25)}`,
                  bgcolor: alpha(colors.text, 0.07),
                },
              }}
            >
              {viewType === "weekly" ? "Week" : "Month"}
            </Button>
          </Box>
        </Box>
        {/* Main Balance */}
        <Box sx={{ mb: hasBudget && daysRemaining > 0 ? 2 : 0 }}>
          <Typography
            sx={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1,
              display: "flex",
              alignItems: "baseline",
            }}
          >
            {(() => {
              const balanceStr = availableBalance.toFixed(2);
              const [dollars, cents] = balanceStr.split(".");
              return (
                <>
                  <span>${dollars}</span>
                  <span
                    style={{
                      fontSize: "1.5rem",
                      color: colors.textSecondary,
                      marginLeft: "2px",
                    }}
                  >
                    .{cents}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: colors.textSecondary,
                      marginLeft: "8px",
                    }}
                  >
                    of ${currentBudget.toFixed(2)}
                  </span>
                </>
              );
            })()}
          </Typography>
        </Box>
        {/* Budget Info Box - Only show if there's a budget */}
        {hasBudget && daysRemaining > 0 && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  color: colors.textSecondary,
                  lineHeight: 1.3,
                }}
              >
                {daysRemaining} more days
                {dailyBudget > 0 && (
                  <span
                    style={{ fontWeight: 700, color: alpha(colors.text, 0.7) }}
                  >
                    {""} - ${dailyBudget.toFixed(2)} per day
                  </span>
                )}
              </Typography>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(usagePercentage, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha(colors.text, 0.1),
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: getProgressColor(usagePercentage),
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          </>
        )}
        {/* Expandable Section */}
        <Box>
          <IconButton
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{
              width: "100%",
              p: 0,
              borderRadius: 1,
              color: colors.textSecondary,
            }}
          >
            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
          <Collapse in={isExpanded}>
            <BudgetBreakdown
              expenses={expensesWithBudget}
              budgets={budgets}
              viewType={viewType}
            />
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );
}
