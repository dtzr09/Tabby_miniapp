import { Box } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import ChartLegend from "../charts/ChartLegend";
import ExpensesPieChart from "../charts/ExpensesPieChart";
import { DBData, ViewMode } from "../../utils/types";
import ExpensesBarChart from "../charts/ExpensesBarChart";
import TimeFrame from "./TimeFrame";

interface ExpensesOverviewCardProps {
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  data: DBData;
}

export default function ExpensesOverviewCard({
  viewMode,
  onViewModeChange,
  data,
}: ExpensesOverviewCardProps) {
  const { colors } = useTheme();
  // Color palette for charts
  const chartColors = [
    colors.primary,
    colors.income,
    colors.expense,
    colors.accent,
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
  ];

  // Prepare data for Recharts
  const barChartData = data.dailyExpenses.map((day, index) => ({
    name: day.day,
    amount: day.amount,
    lineValue: day.amount * 1.1, // Line chart value (slightly higher for visibility)
    fill: index === 1 ? colors.accent : colors.primary,
  }));

  const pieChartData = data.categories
    .filter((category) => category.spent > 0) // Only include categories with expenses
    .map((category, index) => ({
      name: category.name,
      value: category.spent,
      fill: chartColors[index % chartColors.length],
    }));

  const timeframes = ["daily", "weekly", "monthly"] as const;

  return (
    <>
      <Box sx={{ px: 1 }}>
        {/* View Mode Toggle */}
        <Box
          sx={{
            display: "flex",
            mb: 4,
            position: "relative",
            justifyContent: "space-between",
          }}
        >
          {timeframes.map((mode) => (
            <TimeFrame
              key={mode}
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              currentTimeFrame={mode}
            />
          ))}
        </Box>

        {/* Total Expenses Pie Chart */}
        <ExpensesPieChart
          chartData={pieChartData}
          viewMode={viewMode}
          totalExpense={data.totalExpenses}
        />

        {/* Legend */}
        <ChartLegend data={pieChartData} />

        {/* Daily/Weekly Breakdown */}
        <ExpensesBarChart chartData={barChartData} />
      </Box>
    </>
  );
}
