import { Typography, Box } from "@mui/material";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Label,
} from "recharts";
import { useTheme } from "../../src/contexts/ThemeContext";

interface ExpensesOverviewCardProps {
  viewMode?: "daily" | "weekly" | "monthly";
  onViewModeChange?: (mode: "daily" | "weekly" | "monthly") => void;
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
  };
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
          {(["daily", "weekly", "monthly"] as const).map((mode) => (
            <Box
              key={mode}
              sx={{
                position: "relative",
                cursor: "pointer",
                px: 3,
                py: 1,
              }}
              onClick={() => onViewModeChange?.(mode)}
            >
              <Typography
                sx={{
                  fontWeight: viewMode === mode ? 700 : 500,
                  fontSize: "1rem",
                  color: viewMode === mode ? colors.text : colors.textSecondary,
                  textTransform: "capitalize",
                }}
              >
                {mode}
              </Typography>
              {viewMode === mode && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Total Expenses Pie Chart */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Box sx={{ width: 200, height: 200, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
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
                width: "160px", // Match the inner radius * 2 (80 * 2)
                height: "160px", // Match the inner radius * 2 (80 * 2)
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
                  fontSize: "1.8rem",
                  color: colors.text,
                  lineHeight: 1.2,
                  mb: 0.5,
                }}
              >
                ${data.totalExpenses.toFixed(2)}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.9rem",
                  color: colors.textSecondary,
                  textTransform: "capitalize",
                  lineHeight: 1.2,
                }}
              >
                {viewMode} expenses
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Legend */}
        {pieChartData.length > 0 && (
          <>
            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "center",
                gap: {
                  xs: 2,
                  sm: 4,
                },
                mb: 3,
              }}
            >
              {/* Left Column */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: {
                    xs: 1,
                    sm: 1.5,
                  },
                  alignItems: "flex-end",
                  minWidth: "120px",
                }}
              >
                {pieChartData
                  .slice(0, Math.ceil(pieChartData.length / 2))
                  .map((entry, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor:
                            chartColors[idx % chartColors.length],
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          color: colors.textSecondary,
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          textAlign: "right",
                        }}
                      >
                        {entry.name}
                      </Typography>
                    </Box>
                  ))}
              </Box>

              {/* Right Column */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  mb: 3,
                  alignItems: "flex-start",
                }}
              >
                {pieChartData
                  .slice(Math.ceil(pieChartData.length / 2))
                  .map((entry, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor:
                            chartColors[
                              Math.ceil(pieChartData.length / 2) +
                                (idx % chartColors.length)
                            ],
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          color: colors.textSecondary,
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          textAlign: "left",
                          flex: 1,
                        }}
                      >
                        {entry.name}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Box>
          </>
        )}

        {/* Daily/Weekly Breakdown */}
        <Box sx={{ height: 200, mt: 4, mb: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={barChartData}
              margin={{ right: 10, bottom: 20, left: -30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.surface} />
              <XAxis
                dataKey="name"
                stroke={colors.textSecondary}
                fontSize={12}
              />
              <YAxis
                stroke={colors.textSecondary}
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.text,
                  border: "none",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  color: colors.card,
                  fontSize: "0.84em",
                  fontWeight: 500,
                  padding: 4,
                  textAlign: "center",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`]}
                labelFormatter={() => ""}
                cursor={false}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill={colors.primary}>
                {barChartData.map((entry, index) => (
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
      </Box>
    </>
  );
}
