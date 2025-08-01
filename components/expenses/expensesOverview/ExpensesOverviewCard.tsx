import { Box } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import ChartLegend from "../../charts/ChartLegend";
import ExpensesPieChart from "../../charts/ExpensesPieChart";
import { DBData, ViewMode } from "../../../utils/types";
import ExpensesBarChart from "../../charts/ExpensesBarChart";
import TimeFrame from "./TimeFrame";
import { chartColors } from "../../../utils/chartColors";

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

  // Prepare data for Recharts
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });

  const barChartData = data.dailyExpenses.map((day) => ({
    name: day.day,
    amount: day.amount,
    lineValue: day.amount * 1.1,
    fill: day.day === today ? colors.primary : colors.accent,
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
