import {
  List,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useMemo } from "react";
import ExpenseListCard from "./ExpenseListCard";
import FilterMenu from "./FilterMenu";
import { AllEntriesResponse } from "../../../utils/types";
import { TelegramUser } from "../../dashboard";
import { FilterType } from "../../../utils/advancedFilterUtils";
import MoreMenuButtons from "../utils/MoreMenuButtons";
import TimeRangeToggle from "../utils/TimeRangeToggle";
import TimeRangeMenu from "../utils/TimeRangeMenu";
import FilterViews from "../utils/FilterViews";
import ExpensesBarChart from "../../charts/ExpensesBarChart";
import { useDateCalculations } from "../../../hooks/useDateCalculations";
import { useEntryFiltering } from "../../../hooks/useEntryFiltering";
import { useChartData } from "../../../hooks/useChartData";
import { useExpenseListHandlers } from "../../../hooks/useExpenseListHandlers";

interface ExpenseListProps {
  allEntries: AllEntriesResponse;
  tgUser: TelegramUser | null;
  isPersonalView?: boolean;
  userId?: string | number;
  chat_id?: string;
  sharedTimePeriod?: "weekly" | "monthly";
}

export default function ExpenseList({
  allEntries,
  tgUser,
  isPersonalView,
  userId,
  chat_id,
}: ExpenseListProps) {
  const { colors } = useTheme();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<FilterType>("all");
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [timeOffset, setTimeOffset] = useState(0);
  const [viewType, setViewType] = useState<"Week" | "Month">("Week");
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [filterOptions, setFilterOptions] = useState<{
    categoryId?: string;
    showIncome?: boolean;
  }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Custom hooks
  const { combineEntries, getFilteredEntries } = useEntryFiltering(
    allEntries,
    isPersonalView,
    userId,
    chat_id,
    tgUser?.id?.toString()
  );

  const handlers = useExpenseListHandlers({
    setIsSearchActive,
    setSearchQuery,
    setCurrentFilter,
    setFilterOptions,
    setViewType,
    setTimeOffset,
    setSelectedDate,
  });

  // Get the earliest expense date
  const earliestDate = useMemo(() => {
    if (!allEntries?.expenses || allEntries.expenses.length === 0) return null;
    const firstDate = new Date(
      Math.min(
        ...allEntries.expenses.map((exp) => new Date(exp.date).getTime())
      )
    );
    firstDate.setHours(0, 0, 0, 0);
    return firstDate;
  }, [allEntries?.expenses]);

  const { dateRange, canGoBack } = useDateCalculations(
    viewType,
    timeOffset,
    earliestDate
  );

  // Filtered entries using the custom hook
  const filteredEntries = useMemo(() => {
    return getFilteredEntries(
      isSearchActive,
      searchQuery,
      dateRange,
      selectedDate,
      viewType,
      filterOptions
    );
  }, [
    getFilteredEntries,
    isSearchActive,
    searchQuery,
    dateRange,
    selectedDate,
    viewType,
    filterOptions,
  ]);

  // Chart data using the custom hook
  const chartData = useChartData(
    allEntries,
    dateRange,
    viewType,
    { primary: colors.primary, accent: colors.accent },
    isPersonalView,
    userId,
    filterOptions
  );

  // Calculate filtered amounts based on current transaction list date range
  const filteredAmounts = useMemo(() => {
    if (!allEntries || !dateRange) {
      return { expenses: 0, income: 0 };
    }

    // Filter expenses
    let expensesData = allEntries.expenses || [];
    let incomeData = allEntries.income || [];

    // Apply personal filtering if needed
    if (isPersonalView && userId && chat_id !== tgUser?.id?.toString()) {
      expensesData = expensesData.filter(
        (expense) =>
          expense.payer_id === userId ||
          expense.shares?.some((share) => share.user_id === userId)
      );
      incomeData = incomeData.filter(
        (income) => income.category?.id === userId
      );
    }

    // Filter by the same date range as the transaction list
    const filteredExpenses = expensesData
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    const filteredIncome = incomeData
      .filter((income) => {
        const incomeDate = new Date(income.date);
        return incomeDate >= dateRange.start && incomeDate <= dateRange.end;
      })
      .reduce((sum, income) => sum + income.amount, 0);

    return {
      expenses: filteredExpenses,
      income: filteredIncome,
    };
  }, [allEntries, dateRange, isPersonalView, userId, chat_id, tgUser?.id]);

  // Calculate percentage change compared to previous period
  const percentageChange = useMemo(() => {
    if (!allEntries || !dateRange) {
      return { percentage: 0, isDecrease: false };
    }

    // Calculate previous period dates
    const previousStart = new Date(dateRange.start);
    const previousEnd = new Date(dateRange.end);

    if (viewType === "Week") {
      // Previous week: go back 7 days from both start and end
      previousStart.setDate(previousStart.getDate() - 7);
      previousEnd.setDate(previousEnd.getDate() - 7);
    } else {
      // Previous month: go back 1 month from both start and end
      previousStart.setMonth(previousStart.getMonth() - 1);
      previousEnd.setMonth(previousEnd.getMonth() - 1);
    }

    // Get expenses for previous period
    let previousExpensesData = allEntries.expenses || [];

    // Apply personal filtering if needed
    if (isPersonalView && userId && chat_id !== tgUser?.id?.toString()) {
      previousExpensesData = previousExpensesData.filter(
        (expense) =>
          expense.payer_id === userId ||
          expense.shares?.some((share) => share.user_id === userId)
      );
    }

    const previousExpenses = previousExpensesData
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= previousStart && expenseDate <= previousEnd;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    if (previousExpenses === 0) {
      return { percentage: 0, isDecrease: filteredAmounts.expenses === 0 };
    }

    const change =
      ((filteredAmounts.expenses - previousExpenses) / previousExpenses) * 100;
    const isDecrease = change < 0;

    return {
      percentage: Math.abs(Math.round(change)),
      isDecrease,
    };
  }, [
    allEntries,
    dateRange,
    filteredAmounts.expenses,
    viewType,
    isPersonalView,
    userId,
    chat_id,
    tgUser?.id,
  ]);

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 0,
        bgcolor: colors.background,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        height: 600,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          p: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          "&:last-child": {
            pb: 2,
          },
        }}
      >
        {/* Header - Fixed */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            mb: isSearchActive ? 2 : 1, // Increased bottom margin when search is active
          }}
        >
          {isSearchActive ? (
            <>
              <TextField
                fullWidth
                autoFocus
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => handlers.updateSearchQuery(e.target.value)}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "28px",
                    borderRadius: 5,
                    bgcolor: colors.incomeExpenseCard,
                    "& fieldset": {
                      border: "none",
                    },
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "0.75rem",
                    py: 0.2,
                    px: 0.5,
                    color: colors.text,
                    "&::placeholder": {
                      color: colors.textSecondary,
                      opacity: 1,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon
                      sx={{
                        color: colors.textSecondary,
                        fontSize: "0.8rem",
                        mr: 0.5,
                      }}
                    />
                  ),
                }}
              />
              <IconButton
                onClick={handlers.cancelSearch}
                sx={{
                  ml: 0.5,
                  p: 0.5,
                  height: "28px",
                  width: "28px",
                  minWidth: "28px",
                  bgcolor: colors.incomeExpenseCard,
                  color: colors.text,
                }}
              >
                <CloseIcon sx={{ fontSize: "0.8rem" }} />
              </IconButton>
            </>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: colors.text,
                    fontSize: "1rem",
                    letterSpacing: "-.025em",
                    left: 0,
                  }}
                >
                  Transactions{" "}
                  {chat_id !== tgUser?.id?.toString() && (
                    <span
                      style={{
                        marginLeft: 0.5,
                        fontSize: "0.7rem",
                        color: colors.textSecondary,
                      }}
                    >
                      {!isPersonalView ? "(Group)" : "(You)"}
                    </span>
                  )}
                </Typography>
              </Box>
              <MoreMenuButtons
                moreMenuAnchor={moreMenuAnchor}
                setMoreMenuAnchor={setMoreMenuAnchor}
                filterMenuAnchor={filterMenuAnchor}
                setFilterMenuAnchor={setFilterMenuAnchor}
                handleSearchToggle={handlers.toggleSearch}
                selectedFilter={currentFilter}
                onClearFilter={handlers.clearFilter}
              />
              <FilterMenu
                selectedFilter={currentFilter}
                anchorEl={filterMenuAnchor}
                onClose={() => setFilterMenuAnchor(null)}
                onFilterChange={handlers.handleFilterChange}
              />
            </>
          )}
        </Box>

        {/* Scrollable Content */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
            msOverflowStyle: "none",
            "-webkit-overflow-scrolling": "touch",
          }}
        >
          {/* Time Range Controls - Only show when search is not active */}
          {!isSearchActive && (
            <>
              {/* Total Spent Display */}
              {dateRange && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "left",
                    py: 2,
                  }}
                >
                  {/* Large Dollar Amount */}
                  <Typography
                    sx={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: colors.text,
                      lineHeight: 1,
                      mb: 0.5,
                    }}
                  >
                    ${filteredAmounts.expenses.toFixed(2)}
                  </Typography>

                  {/* Bottom Row: Text and Percentage */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        color: colors.textSecondary,
                        fontWeight: 500,
                      }}
                    >
                      Total spent this {viewType.toLowerCase()}
                    </Typography>
                    {percentageChange.percentage > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.25,
                        }}
                      >
                        {percentageChange.isDecrease ? (
                          <TrendingDownIcon
                            sx={{
                              fontSize: "1rem",
                              color: colors.income,
                            }}
                          />
                        ) : (
                          <TrendingUpIcon
                            sx={{
                              fontSize: "1rem",
                              color: colors.expense,
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            color: percentageChange.isDecrease
                              ? colors.income
                              : colors.expense,
                            fontWeight: 500,
                          }}
                        >
                          {percentageChange.percentage}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <TimeRangeToggle
                  timeRange={dateRange.display}
                  setTimeOffset={handlers.handleTimeOffsetChange}
                  timeOffset={timeOffset}
                  canGoBack={canGoBack}
                />
                <TimeRangeMenu
                  viewType={viewType}
                  onViewTypeChange={handlers.handleViewTypeChange}
                />
              </Box>

              {/* Bar Chart */}
              {chartData.length > 0 &&
                chartData.some((data) => data.amount > 0) && (
                  <ExpensesBarChart
                    chartData={chartData}
                    onDateSelect={handlers.handleDateSelect}
                    selectedDate={selectedDate}
                  />
                )}

              <Box sx={{ mb: 0.5 }}>
                <FilterViews
                  filterType={currentFilter}
                  entries={combineEntries()}
                  selectedCategory={filterOptions.categoryId}
                  onCategorySelect={handlers.handleCategorySelect}
                  selectedType={
                    filterOptions.showIncome === true ? "income" : "expense"
                  }
                  onTypeSelect={handlers.handleTypeSelect}
                />
              </Box>
            </>
          )}

          {/* Expense List */}
          <List sx={{ p: 0 }}>
            <ExpenseListCard
              entries={filteredEntries}
              tgUser={tgUser}
              chat_id={chat_id}
            />
          </List>
        </Box>
      </CardContent>
    </Card>
  );
}
