import { Card, Box, Divider, alpha } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import IncomeExpenseCard from "./IncomeExpenseCard";
import { Expense, Income } from "../../utils/types";
import { useMemo } from "react";

interface ExpenseSummaryCardProps {
  totalIncome: number;
  totalExpenses: number;
  timePeriod?: "weekly" | "monthly";
  expenses?: Expense[];
  income?: Income[];
}

export default function ExpenseSummaryCard({
  totalIncome,
  totalExpenses,
  timePeriod = "monthly",
  expenses = [],
  income = [],
}: ExpenseSummaryCardProps) {
  const { colors } = useTheme();

  // Calculate filtered amounts based on time period
  const filteredAmounts = useMemo(() => {
    if (timePeriod === "weekly") {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() - adjustedDay + 1);
      monday.setHours(0, 0, 0, 0);

      const weeklyExpenses = expenses
        .filter((expense) => new Date(expense.date) >= monday)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const weeklyIncome = income
        .filter((inc) => new Date(inc.date) >= monday)
        .reduce((sum, inc) => sum + inc.amount, 0);

      return {
        expenses: weeklyExpenses,
        income: weeklyIncome,
      };
    }

    return {
      expenses: totalExpenses,
      income: totalIncome,
    };
  }, [timePeriod, expenses, income, totalExpenses, totalIncome]);

  return (
    <Card
      sx={{
        px: 4,
        py: 2,
        borderRadius: 4,
        bgcolor: colors.background,
        border: `1px solid ${colors.border}`,
        boxShadow: 0,
        flex: 1,
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <IncomeExpenseCard amount={filteredAmounts.income} type="income" />
        </Box>
        <Divider
          orientation="vertical"
          flexItem
          sx={{ backgroundColor: alpha(colors.border, 0.5) }}
        />
        <Box sx={{ flex: 1 }}>
          <IncomeExpenseCard amount={filteredAmounts.expenses} type="expense" />
        </Box>
      </Box>
    </Card>
  );
}
