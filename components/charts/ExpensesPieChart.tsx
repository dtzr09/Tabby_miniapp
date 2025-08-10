import { Box, Typography } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PieChartData, ViewMode } from "../../utils/types";

interface ExpensesPieChartProps {
  chartData: PieChartData[];
  viewMode?: ViewMode;
  totalExpense: number;
}

const ExpensesPieChart = (props: ExpensesPieChartProps) => {
  const { colors } = useTheme();

  if (props.chartData.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 4 }}>
        <Typography variant="body1" sx={{ color: colors.textSecondary }}>
          No expenses yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Box
        sx={{
          width: 170,
          height: 170,
          position: "relative",
          "& .recharts-wrapper": {
            outline: "none",
          },
          "& .recharts-surface": {
            outline: "none",
          },
          "& .recharts-chart-container": {
            outline: "none",
          },
          "& *": {
            outline: "none !important",
          },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart style={{ outline: "none" }}>
            <Pie
              data={props.chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={85}
              paddingAngle={1}
              dataKey="value"
              stroke="none"
            >
              {props.chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            width: "140px", // Match the inner radius * 2 (80 * 2)
            height: "140px", // Match the inner radius * 2 (80 * 2)
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "50%",
            backgroundColor: colors.card,
            boxShadow: `inset 0 0 0 1px ${colors.border}`,
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1.5rem",
              color: colors.text,
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            ${props.totalExpense.toFixed(2)}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: colors.textSecondary,
              textTransform: "capitalize",
              lineHeight: 1.2,
            }}
          >
            {props.viewMode} expenses
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ExpensesPieChart;
