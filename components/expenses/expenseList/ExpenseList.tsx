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
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useMemo } from "react";
import ExpenseListCard from "./ExpenseListCard";
import FilterMenu from "./FilterMenu";
import { AllEntriesResponse, UnifiedEntry } from "../../../utils/types";
import { TelegramUser } from "../../dashboard";
import { FilterType } from "../../../utils/advancedFilterUtils";
import MoreMenuButtons from "../utils/MoreMenuButtons";
import TimeRangeToggle from "../utils/TimeRangeToggle";
import TimeRangeMenu from "../utils/TimeRangeMenu";
import FilterViews from "../utils/FilterViews";
import ExpensesBarChart from "../../charts/ExpensesBarChart";
import { alpha } from "@mui/material/styles";
import { cleanCategoryName } from "../../../utils/categoryUtils";

interface ExpenseListProps {
  allEntries: AllEntriesResponse;
  tgUser: TelegramUser | null;
}

export default function ExpenseList({ allEntries, tgUser }: ExpenseListProps) {
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

  // Combine income and expenses into unified entries
  const combineEntries = (): UnifiedEntry[] => {
    const combined: UnifiedEntry[] = [];

    // Add expenses
    if (allEntries?.expenses) {
      allEntries.expenses.forEach((expense) => {
        const categoryName = expense.category?.name || "Other";
        const { emoji } = cleanCategoryName(categoryName);

        combined.push({
          id: expense.id,
          description: expense.description,
          category: categoryName,
          emoji: expense.category?.emoji || emoji,
          date: expense.date,
          amount: expense.amount,
          isIncome: expense.is_income,
        });
      });
    }

    // Add income entries
    if (allEntries?.income) {
      allEntries.income.forEach((income) => {
        const categoryName = income.category?.name || "Income";
        const { emoji } = cleanCategoryName(categoryName);

        combined.push({
          id: income.id,
          description: income.description,
          category: categoryName,
          emoji: income.category?.emoji || emoji || "💰",
          date: income.date,
          amount: income.amount,
          isIncome: true,
        });
      });
    }

    return combined;
  };

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

  // Helper functions for date calculations
  const getWeekStart = (date: Date) => {
    const currentDay = date.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const result = new Date(date);
    result.setDate(date.getDate() - daysToMonday);
    result.setHours(0, 0, 0, 0);
    return result;
  };

  const getMonthStart = (date: Date) => {
    const result = new Date(date.getFullYear(), date.getMonth(), 1);
    result.setHours(0, 0, 0, 0);
    return result;
  };

  // Calculate the earliest allowed date (start of week/month containing earliest expense)
  const earliestAllowedDate = useMemo(() => {
    if (!earliestDate) return null;
    return viewType === "Week"
      ? getWeekStart(earliestDate)
      : getMonthStart(earliestDate);
  }, [earliestDate, viewType]);

  // Calculate if we can go back based on earliest expense
  const canGoBack = useMemo(() => {
    if (!earliestAllowedDate) return false;

    const now = new Date();
    const targetDate =
      viewType === "Week"
        ? getWeekStart(
            new Date(now.setDate(now.getDate() + (timeOffset - 1) * 7))
          )
        : getMonthStart(
            new Date(now.setMonth(now.getMonth() + timeOffset - 1))
          );

    return targetDate >= earliestAllowedDate;
  }, [timeOffset, viewType, earliestAllowedDate]);

  // Calculate current date range
  const dateRange = useMemo(() => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    if (viewType === "Week") {
      startDate = getWeekStart(
        new Date(today.setDate(today.getDate() + timeOffset * 7))
      );
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
    } else {
      startDate = getMonthStart(
        new Date(today.setMonth(today.getMonth() + timeOffset))
      );
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
    }

    // Ensure we don't go before the earliest allowed date
    if (earliestAllowedDate && startDate < earliestAllowedDate) {
      startDate = new Date(earliestAllowedDate);
      endDate =
        viewType === "Week"
          ? new Date(startDate.setDate(startDate.getDate() + 6))
          : new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    return {
      display: `${formatDate(startDate)} - ${formatDate(
        endDate
      )}, ${endDate.getFullYear()}`,
      start: startDate,
      end: endDate,
    };
  }, [timeOffset, viewType, earliestAllowedDate]);

  const searchExpenses = (
    entries: UnifiedEntry[],
    query: string
  ): UnifiedEntry[] => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    return entries.filter((entry) => {
      const searchableText = entry.description?.toLowerCase() || "";
      return searchTerms.every((term) => searchableText.includes(term));
    });
  };

  // Update the filteredEntries logic
  const filteredEntries = useMemo(() => {
    let entries = combineEntries();

    // If search is active but query is empty, return empty array
    if (isSearchActive && !searchQuery.trim()) {
      return [];
    }

    // Apply search filter first if active
    if (isSearchActive && searchQuery) {
      entries = searchExpenses(entries, searchQuery);
    } else {
      // Only apply date filters if not searching
      // Apply date range filter first
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);

      // Set to start and end of day
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      entries = entries.filter((entry) => {
        const entryDate = new Date(entry.date);
        const isInRange = entryDate >= start && entryDate <= end;
        return isInRange;
      });

      // Apply date selection filter if active
      if (selectedDate) {
        entries = entries.filter((entry) => {
          const entryDate = new Date(entry.date);
          if (viewType === "Week") {
            const dayName = entryDate.toLocaleDateString("en-US", {
              weekday: "short",
            });
            return dayName === selectedDate;
          } else {
            // Make sure the format matches exactly what's shown in the chart
            const formattedDayMonth = `${entryDate.getDate()} ${entryDate.toLocaleDateString(
              "en-US",
              { month: "short" }
            )}`;
            return formattedDayMonth === selectedDate;
          }
        });
      }
    }

    // Apply category filter
    if (filterOptions.categoryId) {
      entries = entries.filter(
        (entry) => entry.category === filterOptions.categoryId
      );
    }

    // Apply type filter
    if (filterOptions.showIncome !== undefined) {
      entries = entries.filter((entry) =>
        filterOptions.showIncome ? entry.isIncome : !entry.isIncome
      );
    }

    // Sort by date, most recent first
    return entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [
    allEntries,
    filterOptions,
    dateRange,
    isSearchActive,
    searchQuery,
    selectedDate,
    viewType,
  ]);

  const chartData = useMemo(() => {
    // Only use expense entries from allEntries.expenses
    const entries =
      allEntries?.expenses?.map((expense) => ({
        id: expense.id,
        description: expense.description,
        category: expense.category?.name || "Other",
        emoji: expense.category?.emoji,
        date: expense.date,
        amount: expense.amount,
        isIncome: expense.is_income,
      })) || [];

    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    // Create a map to store daily totals
    const dailyTotals = new Map<string, number>();

    if (viewType === "Week") {
      // Initialize all days in the range with 0
      const current = new Date(start);
      while (current <= end) {
        const dayKey = current.toLocaleDateString("en-US", {
          weekday: "short",
        });
        dailyTotals.set(dayKey, 0);
        current.setDate(current.getDate() + 1);
      }

      // Sum up amounts for each day
      entries.forEach((entry) => {
        const entryDate = new Date(entry.date);
        if (entryDate >= start && entryDate <= end) {
          const dayKey = entryDate.toLocaleDateString("en-US", {
            weekday: "short",
          });
          const currentTotal = dailyTotals.get(dayKey) || 0;
          dailyTotals.set(dayKey, currentTotal + Math.abs(entry.amount));
        }
      });

      // Convert to chart data format
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
      });
      return Array.from(dailyTotals.entries()).map(([day, amount]) => ({
        name: day,
        amount,
        lineValue: amount * 1.1,
        fill: day === today ? colors.primary : colors.accent,
      }));
    } else {
      // Monthly view
      const current = new Date(start);
      const month = current.toLocaleDateString("en-US", { month: "short" });

      // Initialize all days in the month with 0
      while (current <= end) {
        const day = current.getDate();
        const dayKey = `${day} ${month}`;
        dailyTotals.set(dayKey, 0);
        current.setDate(current.getDate() + 1);
      }

      // Sum up amounts for each day
      entries.forEach((entry) => {
        const entryDate = new Date(entry.date);
        if (entryDate >= start && entryDate <= end) {
          const day = entryDate.getDate();
          const dayKey = `${day} ${month}`;
          const currentTotal = dailyTotals.get(dayKey) || 0;
          dailyTotals.set(dayKey, currentTotal + Math.abs(entry.amount));
        }
      });

      // Convert to chart data format
      const today = new Date();
      const todayKey = `${today.getDate()} ${month}`;
      return Array.from(dailyTotals.entries()).map(([day, amount]) => ({
        name: day,
        amount,
        lineValue: amount * 1.1,
        fill: day === todayKey ? colors.primary : colors.accent,
      }));
    }
  }, [dateRange, allEntries, colors.primary, colors.accent, viewType]);

  // Handlers
  const handleSearch = {
    toggle: () => {
      setIsSearchActive(true);
      setSearchQuery("");
    },
    cancel: () => {
      setIsSearchActive(false);
      setSearchQuery("");
    },
    update: (value: string) => setSearchQuery(value),
  };

  const handleFilter = {
    change: (type: FilterType) => {
      setCurrentFilter(type);
      setFilterOptions({});
    },
    clear: () => {
      setCurrentFilter("all");
      setFilterOptions({});
    },
    setCategory: (category: string) =>
      setFilterOptions((prev) => ({ ...prev, categoryId: category })),
    setType: (type: "income" | "expense") =>
      setFilterOptions((prev) => ({ ...prev, showIncome: type === "income" })),
  };

  const handleView = {
    changeType: (type: "Week" | "Month") => {
      setViewType(type);
      setTimeOffset(0);
      setSelectedDate(null);
    },
    setDate: (date: string | null) => setSelectedDate(date),
    setOffset: (offset: number) => {
      setTimeOffset(offset);
      setSelectedDate(null);
    },
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 0,
        bgcolor: colors.card,
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
            mb: isSearchActive ? 2 : 0.5, // Increased bottom margin when search is active
          }}
        >
          {isSearchActive ? (
            <>
              <TextField
                fullWidth
                autoFocus
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => handleSearch.update(e.target.value)}
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
                onClick={handleSearch.cancel}
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
                Transactions
              </Typography>
              <MoreMenuButtons
                moreMenuAnchor={moreMenuAnchor}
                setMoreMenuAnchor={setMoreMenuAnchor}
                filterMenuAnchor={filterMenuAnchor}
                setFilterMenuAnchor={setFilterMenuAnchor}
                handleSearchToggle={handleSearch.toggle}
                selectedFilter={currentFilter}
                onClearFilter={handleFilter.clear}
              />
              <FilterMenu
                selectedFilter={currentFilter}
                anchorEl={filterMenuAnchor}
                onClose={() => setFilterMenuAnchor(null)}
                onFilterChange={handleFilter.change}
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <TimeRangeToggle
                  timeRange={dateRange.display}
                  setTimeOffset={handleView.setOffset}
                  timeOffset={timeOffset}
                  canGoBack={canGoBack}
                />
                <TimeRangeMenu
                  viewType={viewType}
                  onViewTypeChange={handleView.changeType}
                />
              </Box>

              {/* Bar Chart */}
              {chartData.length > 0 &&
                chartData.some((data) => data.amount > 0) && (
                  <ExpensesBarChart
                    chartData={chartData}
                    onDateSelect={handleView.setDate}
                    selectedDate={selectedDate}
                  />
                )}

              <Box sx={{ mb: 0.5 }}>
                <FilterViews
                  filterType={currentFilter}
                  entries={combineEntries()}
                  selectedCategory={filterOptions.categoryId}
                  onCategorySelect={handleFilter.setCategory}
                  selectedType={filterOptions.showIncome ? "income" : "expense"}
                  onTypeSelect={handleFilter.setType}
                />
              </Box>
            </>
          )}

          {/* Expense List */}
          <List sx={{ p: 0 }}>
            <ExpenseListCard entries={filteredEntries} tgUser={tgUser} />
          </List>
        </Box>
      </CardContent>
    </Card>
  );
}
