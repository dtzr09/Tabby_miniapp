import { Card, Box, Divider, alpha } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import IncomeExpenseCard from "./IncomeExpenseCard";

interface ExpenseSummaryCardProps {
  totalIncome: number;
  totalExpenses: number;
}

export default function ExpenseSummaryCard({
  totalIncome,
  totalExpenses,
}: ExpenseSummaryCardProps) {
  const { colors } = useTheme();

  return (
    <Card
      sx={{
        px: 4,
        py: 2,
        borderRadius: 4,
        bgcolor: colors.card,
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
          <IncomeExpenseCard amount={totalIncome} type="income" />
        </Box>
        <Divider
          orientation="vertical"
          flexItem
          sx={{ backgroundColor: alpha(colors.border, 0.5) }}
        />
        <Box sx={{ flex: 1 }}>
          <IncomeExpenseCard amount={totalExpenses} type="expense" />
        </Box>
      </Box>
    </Card>
  );
}
