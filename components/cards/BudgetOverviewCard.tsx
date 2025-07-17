import { Card, CardContent, Typography, Box, IconButton } from "@mui/material";
import { useState } from "react";
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
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useTheme } from "../../src/contexts/ThemeContext";

interface Budget {
  id: number;
  amount: number;
  created_at: string;
  updated_at: string;
  category: {
    id: number;
    name: string;
  };
}

interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  is_income: boolean;
  category?: {
    name: string;
    emoji?: string;
  };
}

interface BudgetOverviewCardProps {
  onCategoryAction?: (categoryId: string) => void;
  viewMode?: "daily" | "weekly" | "monthly";
  onViewModeChange?: (mode: "daily" | "weekly" | "monthly") => void;
  expenses?: Expense[];
  budgets?: Budget[];
}

export default function BudgetOverviewCard({
  onCategoryAction,
  viewMode: externalViewMode,
  onViewModeChange,
  expenses = [], // Add expenses prop with default empty array
  budgets = [], // Add budgets prop with default empty array
}: BudgetOverviewCardProps) {
  const { colors } = useTheme();
  const [internalViewMode, setInternalViewMode] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");

  const viewMode = externalViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  // Function to filter expenses by time period
  const getFilteredExpenses = (period: "daily" | "weekly" | "monthly") => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return expenses.filter((exp) => {
      if (exp.is_income) return false; // Only show expenses, not income

      const expDate = new Date(exp.date);

      switch (period) {
        case "daily":
          return expDate >= today;
        case "weekly":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return expDate >= weekAgo;
        case "monthly":
          const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
          return expDate >= monthAgo;
        default:
          return false;
      }
    });
  };

  // Function to generate category data from real expenses
  const getCategoryData = (period: "daily" | "weekly" | "monthly") => {
    const filteredExpenses = getFilteredExpenses(period);
    const categoryMap = new Map<
      string,
      { name: string; spent: number; emoji: string; budget: number }
    >();

    // First, add all budgets to the map
    budgets.forEach((budget) => {
      // Handle both nested category object and direct category name
      const categoryName = budget.category?.name;
      if (!categoryName) return;

      // Extract emoji from category name (more comprehensive emoji regex)
      const emojiMatch = categoryName.match(
        /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/u
      );
      const emoji = emojiMatch ? emojiMatch[0] : "⚪";

      // Remove emoji from category name and trim
      const cleanName = categoryName
        .replace(
          /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]\s*/u,
          ""
        )
        .trim();

      categoryMap.set(cleanName, {
        name: cleanName,
        spent: 0, // Will be updated with expenses
        emoji,
        budget: budget.amount || 0,
      });
    });

    // Then, add expenses to the map
    filteredExpenses.forEach((exp) => {
      // Handle both nested category object and direct category name
      const categoryName = exp.category?.name || "Other";

      // Extract emoji from category name (more comprehensive emoji regex)
      const emojiMatch = categoryName.match(
        /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/u
      );
      const emoji = emojiMatch ? emojiMatch[0] : "⚪";

      // Remove emoji from category name and trim
      const cleanName = categoryName
        .replace(
          /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]\s*/u,
          ""
        )
        .trim();

      if (categoryMap.has(cleanName)) {
        categoryMap.get(cleanName)!.spent += Math.abs(exp.amount);
      } else {
        categoryMap.set(cleanName, {
          name: cleanName,
          spent: Math.abs(exp.amount),
          emoji,
          budget: 0, // No budget set for this category
        });
      }
    });

    return Array.from(categoryMap.values()).map((cat, index) => ({
      id: `category-${index}`,
      name: cat.name,
      icon: <span>{cat.emoji}</span>,
      budget: cat.budget,
      spent: cat.spent,
      color: ["#4CAF50", "#FF9800", "#2196F3", "#9C27B0", "#F44336", "#00BCD4"][
        index % 6
      ],
    }));
  };

  // Function to generate daily/weekly breakdown from real expenses
  const getDailyBreakdown = (period: "daily" | "weekly" | "monthly") => {
    const filteredExpenses = getFilteredExpenses(period);

    if (period === "daily") {
      // Group by hour for daily view
      const hourMap = new Map<number, number>();
      filteredExpenses.forEach((exp) => {
        const hour = new Date(exp.date).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + Math.abs(exp.amount));
      });

      return Array.from({ length: 24 }, (_, i) => ({
        day: `${i}:00`,
        amount: hourMap.get(i) || 0,
      }));
    } else if (period === "weekly") {
      // Group by day of week
      const dayMap = new Map<string, number>();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      filteredExpenses.forEach((exp) => {
        const day = dayNames[new Date(exp.date).getDay()];
        dayMap.set(day, (dayMap.get(day) || 0) + Math.abs(exp.amount));
      });

      return dayNames.map((day) => ({
        day,
        amount: dayMap.get(day) || 0,
      }));
    } else {
      // Group by week for monthly view
      const weekMap = new Map<number, number>();
      filteredExpenses.forEach((exp) => {
        const week = Math.ceil(new Date(exp.date).getDate() / 7);
        weekMap.set(week, (weekMap.get(week) || 0) + Math.abs(exp.amount));
      });

      return Array.from({ length: 4 }, (_, i) => ({
        day: `Week ${i + 1}`,
        amount: weekMap.get(i + 1) || 0,
      }));
    }
  };

  // Generate real data based on expenses
  const getRealData = (period: "daily" | "weekly" | "monthly") => {
    const filteredExpenses = getFilteredExpenses(period);
    const totalExpenses = filteredExpenses.reduce(
      (sum, exp) => sum + Math.abs(exp.amount),
      0
    );
    const categories = getCategoryData(period);
    const dailyExpenses = getDailyBreakdown(period);

    return {
      totalExpenses,
      dateRange:
        period === "daily"
          ? "Today"
          : period === "weekly"
          ? "This Week"
          : "This Month",
      dailyExpenses,
      categories,
    };
  };

  const data = getRealData(viewMode);

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

  const pieChartData = data.categories.map((category, index) => ({
    name: category.name,
    value: category.spent,
    fill: chartColors[index % chartColors.length],
  }));

  return (
    <Card
      sx={{
        borderRadius: 4,
        bgcolor: colors.card,
        boxShadow: 0,
        border: `1px solid ${colors.border}`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* View Mode Toggle */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 3,
            position: "relative",
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
              onClick={() => setViewMode(mode)}
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
            mb: 3,
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
                      backgroundColor: chartColors[idx % chartColors.length],
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

        {/* Daily/Weekly Breakdown */}
        <Box sx={{ mb: 4, height: 200 }}>
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

        {/* Budget Section */}
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  color: colors.text,
                }}
              >
                Budget
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.9rem",
                  color: colors.textSecondary,
                }}
              >
                {data.categories.length} in total
              </Typography>
            </Box>
          </Box>

          {data.categories.length === 0 && (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                color: colors.textSecondary,
              }}
            >
              <Typography variant="body2">
                No budgets or expenses found. Add some expenses to see your
                budget overview!
              </Typography>
            </Box>
          )}

          {/* Budget Categories */}
          {data.categories.length > 0 && (
            <Box
              sx={{
                display: "flex",
                gap: 2,
                overflowX: "auto",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {data.categories.map((category) => {
                if (category.budget === 0 || category.spent === undefined) {
                  return null;
                }
                const progress = (category.spent / category.budget) * 100;

                return (
                  <Box
                    key={category.id}
                    sx={{
                      minWidth: 120,
                      p: 2,
                      borderRadius: 3,
                      backgroundColor: colors.surface,
                      position: "relative",
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        color: colors.textSecondary,
                      }}
                      onClick={() => onCategoryAction?.(category.id)}
                    >
                      <MoreVertIcon sx={{ fontSize: 16 }} />
                    </IconButton>

                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: `conic-gradient(${category.color} ${
                          progress * 3.6
                        }deg, ${colors.surface} 0deg)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 45,
                          height: 45,
                          borderRadius: "50%",
                          backgroundColor: colors.card,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Box sx={{ color: category.color, fontSize: 20 }}>
                          {category.icon}
                        </Box>
                      </Box>
                    </Box>

                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: colors.text,
                        textAlign: "center",
                      }}
                    >
                      ${category.spent}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        color: colors.textSecondary,
                        textAlign: "center",
                        opacity: 0.7,
                        mb: 1,
                      }}
                    >
                      {`of $${category.budget}`}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        color: colors.textSecondary,
                        textAlign: "center",
                      }}
                    >
                      {category.name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
