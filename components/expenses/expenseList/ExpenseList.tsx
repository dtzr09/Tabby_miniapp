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
import { FilterType, applyFilter } from "../../../utils/advancedFilterUtils";
import MoreMenuButtons from "../utils/MoreMenuButtons";
import TimeRangeToggle from "../utils/TimeRangeToggle";
import TimeRangeMenu from "../utils/TimeRangeMenu";
import FilterViews from "../utils/FilterViews";
import { alpha } from "@mui/material/styles";

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

  // Combine income and expenses into unified entries
  const combineEntries = (): UnifiedEntry[] => {
    const combined: UnifiedEntry[] = [];

    // Add expenses
    if (allEntries?.expenses) {
      allEntries.expenses.forEach((expense) => {
        combined.push({
          id: expense.id,
          description: expense.description,
          category: expense.category?.name || "Other",
          emoji: expense.category?.emoji,
          date: expense.date,
          amount: expense.amount,
          isIncome: expense.is_income,
        });
      });
    }

    // Add income entries
    if (allEntries?.income) {
      allEntries.income.forEach((income) => {
        combined.push({
          id: income.id,
          description: income.description,
          category: income.category?.name || "Income",
          emoji: undefined,
          date: income.date,
          amount: income.amount,
          isIncome: true,
        });
      });
    }

    return combined;
  };

  const dateRange = useMemo(() => {
    const today = new Date();

    if (viewType === "Week") {
      const startOfWeek = new Date(today);
      // Get current day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const currentDay = today.getDay();
      // Calculate days to subtract to get to Monday (Monday = 1, so for Sunday we subtract 6, for Monday 0, for Tuesday 1, etc.)
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
      // Set to start of current week (Monday) and apply offset
      startOfWeek.setDate(today.getDate() - daysToMonday + timeOffset * 7);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Add 6 days to get to Sunday

      const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      };

      return {
        display: `${formatDate(startOfWeek)} - ${formatDate(
          endOfWeek
        )}, ${endOfWeek.getFullYear()}`,
        start: startOfWeek,
        end: endOfWeek,
      };
    } else {
      const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + timeOffset,
        1
      );
      const endOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + timeOffset + 1,
        0
      );

      const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      };

      return {
        display: `${formatDate(startOfMonth)} - ${formatDate(
          endOfMonth
        )}, ${endOfMonth.getFullYear()}`,
        start: startOfMonth,
        end: endOfMonth,
      };
    }
  }, [timeOffset, viewType]);

  const filteredEntries = useMemo(() => {
    const unifiedEntries = combineEntries();

    // First apply the time range filter
    const timeFilteredEntries = unifiedEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= dateRange.start && entryDate <= dateRange.end;
    });

    // Then apply any other filters
    return applyFilter(timeFilteredEntries, currentFilter, filterOptions);
  }, [allEntries, currentFilter, dateRange, filterOptions]);

  const handleViewTypeChange = (type: "Week" | "Month") => {
    setViewType(type);
    setTimeOffset(0); // Reset offset when changing view type
  };

  const handleSearchToggle = () => {
    setIsSearchActive(true);
    setSearchQuery("");
  };

  const handleSearchCancel = () => {
    setIsSearchActive(false);
    setSearchQuery("");
  };

  const handleFilterChange = (type: FilterType) => {
    setCurrentFilter(type);
    // Reset options when changing filter type
    setFilterOptions({});
  };

  const handleClearFilter = () => {
    setCurrentFilter("all");
    setFilterOptions({});
  };

  const handleCategorySelect = (category: string) => {
    setFilterOptions((prev) => ({
      ...prev,
      categoryId: category,
    }));
  };

  const handleTypeSelect = (type: "expense" | "income") => {
    setFilterOptions((prev) => ({
      ...prev,
      showIncome: type === "income",
    }));
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
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            mb: isSearchActive ? 0 : 0.5,
          }}
        >
          {isSearchActive ? (
            <>
              <TextField
                fullWidth
                autoFocus
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                onClick={handleSearchCancel}
                sx={{
                  ml: 0.5,
                  p: 0.5,
                  height: "28px",
                  width: "28px",
                  minWidth: "28px",
                  bgcolor: colors.incomeExpenseCard,
                  color: colors.text,
                  "&:hover": {
                    color: colors.primary,
                    bgcolor: alpha(colors.primary, 0.1),
                  },
                  transition: "all 0.2s ease-in-out",
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
                handleSearchToggle={handleSearchToggle}
                selectedFilter={currentFilter}
                onClearFilter={handleClearFilter}
              />
              <FilterMenu
                selectedFilter={currentFilter}
                anchorEl={filterMenuAnchor}
                onClose={() => setFilterMenuAnchor(null)}
                onFilterChange={handleFilterChange}
              />
            </>
          )}
        </Box>

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
                setTimeOffset={setTimeOffset}
                timeOffset={timeOffset}
              />
              <TimeRangeMenu
                viewType={viewType}
                onViewTypeChange={handleViewTypeChange}
              />
            </Box>

            <Box sx={{ mb: 0.5 }}>
              <FilterViews
                filterType={currentFilter}
                entries={combineEntries()}
                selectedCategory={filterOptions.categoryId}
                onCategorySelect={handleCategorySelect}
                selectedType={filterOptions.showIncome ? "income" : "expense"}
                onTypeSelect={handleTypeSelect}
              />
            </Box>
          </>
        )}

        {/* Scrollable List */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <List
            sx={{
              height: "100%",
              overflow: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              msOverflowStyle: "none",
              "-webkit-overflow-scrolling": "touch",
            }}
          >
            <ExpenseListCard
              entries={isSearchActive ? [] : filteredEntries}
              tgUser={tgUser}
            />
          </List>
        </Box>
      </CardContent>
    </Card>
  );
}
