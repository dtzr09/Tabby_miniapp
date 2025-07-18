import { Card } from "@mui/material";
import React from "react";
import BudgetOverviewCard from "./BudgetOverviewCard";
import ExpensesOverviewCard from "./ExpensesOverviewCard";
import { useTheme } from "@/contexts/ThemeContext";

interface ExpensesAndBudgetOverviewProps {
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
  viewMode?: "daily" | "weekly" | "monthly";
  onViewModeChange?: (mode: "daily" | "weekly" | "monthly") => void;
}

const ExpensesAndBudgetOverview = ({
  data,
  viewMode,
  onViewModeChange,
}: ExpensesAndBudgetOverviewProps) => {
  const { colors } = useTheme();

  return (
    <Card
      sx={{
        px: 2,
        py: 2,
        borderRadius: 4,
        bgcolor: colors.card,
        boxShadow: "none",
        border: `1px solid ${colors.border}`,
      }}
    >
      <ExpensesOverviewCard
        data={data}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
      <BudgetOverviewCard
        data={data}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
    </Card>
  );
};

export default ExpensesAndBudgetOverview;
