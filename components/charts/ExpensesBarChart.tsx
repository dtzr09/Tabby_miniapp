import { alpha, Box } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { BarChartData } from "../../utils/types";
import {
  Bar,
  ComposedChart,
  Label,
  ResponsiveContainer,
  // Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
} from "recharts";
// import { ChartToolTip } from "./ChartToolTip";
import React from "react";

interface ExpensesBarChartProps {
  chartData: BarChartData[];
  onDateSelect?: (date: string | null) => void;
  selectedDate?: string | null; // Add this prop
}

const ExpensesBarChart = (props: ExpensesBarChartProps) => {
  const { colors } = useTheme();
  // Remove local state and use prop instead
  // const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  // Calculate max value and average spending
  const maxValue = Math.max(...props.chartData.map((d) => d.amount));
  const averageSpending =
    props.chartData.length > 0 ? props.chartData[0]?.lineValue || 0 : 0;
  const niceMaxValue = (() => {
    // Round up to nearest nice number based on scale
    if (maxValue <= 100) {
      return Math.ceil(maxValue / 25) * 25; // Rounds to nearest 25
    } else if (maxValue <= 500) {
      return Math.ceil(maxValue / 250) * 250; // Rounds to nearest 250
    } else if (maxValue <= 1000) {
      return Math.ceil(maxValue / 250) * 250; // Rounds to nearest 250
    } else if (maxValue <= 5000) {
      return Math.ceil(maxValue / 1000) * 1000; // Rounds to nearest 1000
    } else {
      return Math.ceil(maxValue / 2500) * 2500; // Rounds to nearest 2500
    }
  })();

  // Generate 4 evenly spaced ticks with nice rounded numbers
  const yAxisTicks = [
    0,
    Math.round(niceMaxValue / 4),
    Math.round(niceMaxValue / 2),
    niceMaxValue,
  ];

  // Add average to ticks if it's not too close to existing ticks
  const ticksWithAverage = [...yAxisTicks];
  if (averageSpending > 0) {
    const isCloseToExisting = yAxisTicks.some(
      (tick) => Math.abs(tick - averageSpending) < niceMaxValue * 0.05
    );
    if (!isCloseToExisting) {
      ticksWithAverage.push(Math.round(averageSpending));
      ticksWithAverage.sort((a, b) => a - b);
    }
  }

  const formatYAxisTick = (value: number) => {
    // Round to integer first
    value = Math.round(value);
    const formattedValue =
      value >= 1000 ? `${Math.round(value / 1000)}k` : value.toString();

    // Check if this is the average value
    return formattedValue;
  };

  // Generate dynamic date ticks based on the first data point's date
  const getDateTicks = () => {
    if (props.chartData.length === 0) return [];

    // Check if we're in week view by looking at the first data point format
    const isWeekView = props.chartData[0]?.name.length <= 3; // "Mon", "Tue", etc.

    if (isWeekView) {
      return undefined; // Let the XAxis show all weekday labels
    }

    // Month view logic
    const dateEntry = props.chartData.find((entry) => entry.amount > 0);
    if (!dateEntry) return [];

    try {
      // Parse the date from the name (assuming format "D MMM")
      const [, month] = dateEntry.name.split(" ");

      // Get the month number (0-11) from the month name
      const monthNumber = new Date(`${month} 1, 2024`).getMonth();

      // Get the number of days in the month
      const daysInMonth = new Date(2024, monthNumber + 1, 0).getDate();

      // Calculate 4 evenly spaced days
      const interval = Math.floor(daysInMonth / 4);
      const days = [
        Math.ceil(interval * 0.5), // ~1/8 of the month
        Math.ceil(interval * 1.5), // ~3/8 of the month
        Math.ceil(interval * 2.5), // ~5/8 of the month
        Math.ceil(interval * 3.5), // ~7/8 of the month
      ];

      // Return the formatted dates
      return days.map((day) => `${day} ${month}`);
    } catch (e) {
      console.error("Error generating date ticks:", e);
      return [];
    }
  };

  const dateTicks = getDateTicks();

  const handleBarClick = (entry: BarChartData) => {
    // Toggle selection - if clicking the same date, clear selection
    const newDate = entry.name === props.selectedDate ? null : entry.name;
    // setSelectedDate(newDate); // Remove this
    if (props.onDateSelect) {
      props.onDateSelect(newDate);
    }
  };

  return (
    <Box
      sx={{
        height: 140,
        mt: 2,
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
        <ComposedChart
          data={props.chartData}
          margin={{ right: 0, left: 0, bottom: 20, top: 0 }}
          style={{ outline: "none" }}
        >
          {yAxisTicks.map((tick) => (
            <ReferenceLine
              key={tick}
              y={tick}
              stroke={colors.textSecondary}
              strokeOpacity={0.3}
              strokeDasharray="3 3"
              yAxisId="right"
            />
          ))}
          <ReferenceLine
            y={averageSpending}
            stroke={alpha(colors.primary, 0.3)}
            strokeWidth={2}
            strokeDasharray="5 5"
            yAxisId="right"
          />
          <XAxis
            dataKey="name"
            stroke={colors.textSecondary}
            fontSize={11}
            axisLine={false}
            tickLine={false}
            dy={8}
            ticks={dateTicks}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={colors.textSecondary}
            fontSize={11}
            tickFormatter={(value) => `$${formatYAxisTick(value)}`}
            ticks={ticksWithAverage}
            domain={[0, niceMaxValue]}
            axisLine={false}
            tickLine={false}
            width={35}
            tick={(props) => {
              const { x, y, payload } = props;
              const value = Math.round(payload.value);
              const isAverageValue = Math.abs(value - averageSpending) < 1;
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="start"
                  fontSize={11}
                  fill={isAverageValue ? colors.primary : colors.textSecondary}
                  fontWeight={isAverageValue ? 600 : 400}
                  dy={4}
                >
                  ${formatYAxisTick(value)}
                </text>
              );
            }}
          />
          {/* <Tooltip content={<ChartToolTip />} /> */}
          <Bar
            dataKey="amount"
            radius={[6, 6, 6, 6]}
            yAxisId="right"
            maxBarSize={35}
            onClick={(data) => handleBarClick(data.payload)}
            cursor="pointer"
          >
            {props.chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors.primary}
                opacity={
                  props.selectedDate === entry.name
                    ? 1
                    : props.selectedDate === null
                    ? 1
                    : 0.3
                }
              >
                <Label
                  content={({ value }) => (
                    <text
                      x={0}
                      y={-6}
                      fill={colors.textSecondary}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={500}
                      opacity={
                        props.selectedDate === entry.name
                          ? 1
                          : props.selectedDate === null
                          ? 1
                          : 0.3
                      }
                    >
                      ${typeof value === "number" ? value.toFixed(0) : value}
                    </text>
                  )}
                />
              </Cell>
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ExpensesBarChart;
