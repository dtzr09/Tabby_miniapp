import { Box } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { BarChartData } from "../../utils/types";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartToolTip } from "./ChartToolTip";

interface ExpensesBarChartProps {
  chartData: BarChartData[];
}
const ExpensesBarChart = (props: ExpensesBarChartProps) => {
  const { colors } = useTheme();

  return (
    <Box sx={{ height: 200, mt: 4, mb: 2 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={props.chartData} margin={{ right: 5, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.surface} />
          <XAxis dataKey="name" stroke={colors.textSecondary} fontSize={12} />
          <YAxis
            stroke={colors.textSecondary}
            fontSize={12}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<ChartToolTip />} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill={colors.primary}>
            {props.chartData.map((entry, index) => (
              <Label
                key={`label-${index}`}
                content={({ value }) => (
                  <text
                    x={0}
                    y={-10}
                    fill={colors.textSecondary}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={500}
                  >
                    ${typeof value === "number" ? value.toFixed(0) : value}
                  </text>
                )}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ExpensesBarChart;
