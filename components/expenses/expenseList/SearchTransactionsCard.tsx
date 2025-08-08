import {
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  TextField,
  alpha,
  Divider,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useRef, useState, useMemo } from "react";
import SearchMenuCard from "./SearchMenuCard";
import FilterOptionCard from "./FilterOptionCard";
import ExpenseListCard from "./ExpenseListCard";
import Pagination from "@mui/material/Pagination";
import { TelegramUser } from "../../dashboard";
import { UnifiedEntry } from "../../../utils/types";
import { getUniqueCategories } from "../../../utils/categoryUtils";
import {
  filterTransactions,
  AmountFilterOption,
  DateFilterOption,
  CategoryFilterOption,
} from "../../../utils/filterUtils";

interface SearchTransactionsCardProps {
  entries: UnifiedEntry[];
  onBack: () => void;
  tgUser: TelegramUser | null;
}

export default function SearchTransactionsCard({
  entries,
  onBack,
  tgUser,
}: SearchTransactionsCardProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [amountFilter, setAmountFilter] = useState("All Amounts");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [categoryAnchor, setCategoryAnchor] = useState<null | HTMLElement>(
    null
  );

  const [amountAnchor, setAmountAnchor] = useState<null | HTMLElement>(null);
  const [dateAnchor, setDateAnchor] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(1);
  const transactionsPerPage = 10;

  const [lastCategoryFilter, setLastCategoryFilter] = useState(categoryFilter);

  useEffect(() => {
    if (lastCategoryFilter !== categoryFilter) {
      setLastCategoryFilter(categoryFilter);
      setPage(1);
    }
  }, [categoryFilter, lastCategoryFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter, amountFilter, dateFilter]);

  // Get unique categories from entries
  const categories = getUniqueCategories(entries);

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    return filterTransactions(entries, {
      searchQuery,
      categoryFilter: categoryFilter as CategoryFilterOption,
      amountFilter: amountFilter as AmountFilterOption,
      dateFilter: dateFilter as DateFilterOption,
    });
  }, [entries, searchQuery, categoryFilter, amountFilter, dateFilter]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const showClearAllFiltersButton =
    categoryFilter !== "All Categories" ||
    amountFilter !== "All Amounts" ||
    dateFilter !== "All Dates" ||
    searchQuery.trim() !== "";

  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  );
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * transactionsPerPage,
    page * transactionsPerPage
  );

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 0,
        bgcolor: colors.card,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      <CardContent sx={{ p: 2 }} ref={scrollContainerRef}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
          }}
        >
          <IconButton
            onClick={onBack}
            sx={{
              color: colors.text,
              mr: 1,
              p: 0.5,
              "&:hover": {
                color: colors.primary,
                bgcolor: alpha(colors.primary, 0.1),
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: colors.text,
              fontSize: "1.2rem",
              letterSpacing: "-.025em",
            }}
          >
            Search Transactions
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: "white", mr: 1 }} fontSize="small" />
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: colors.inputBg,
                "& fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  border: `2px solid white`,
                },
              },
              "& .MuiInputBase-input": {
                fontSize: "0.9rem",
                color: "white",
                fontWeight: 500,
                "&::placeholder": {
                  color: "white",
                  opacity: 0.7,
                },
              },
            }}
          />
        </Box>

        {/* Filter Options */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mb: 2,
          }}
        >
          <FilterOptionCard
            label="Category"
            value={categoryFilter}
            onClick={(e) =>
              setCategoryAnchor((prev) => (prev ? null : e.currentTarget))
            }
            type="category"
          />
          <FilterOptionCard
            label="Amount"
            value={amountFilter}
            onClick={(e) =>
              setAmountAnchor((prev) => (prev ? null : e.currentTarget))
            }
            type="amount"
          />
          <FilterOptionCard
            label="Date Range"
            value={dateFilter}
            onClick={(e) =>
              setDateAnchor((prev) => (prev ? null : e.currentTarget))
            }
            type="date"
          />
        </Box>

        {/* Results Count */}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: colors.textSecondary,
              mb: 2,
              fontWeight: 500,
            }}
          >
            {filteredTransactions.length} transactions found
          </Typography>
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: colors.textSecondary,
              mb: 2,
              fontWeight: 500,
            }}
          >
            Page {page} of {totalPages}
          </Typography>
        </Box>

        {/* Transactions List */}
        <ExpenseListCard entries={paginatedTransactions} tgUser={tgUser} />
        {totalPages > 1 && (
          <>
            <Divider sx={{ mt: 2, backgroundColor: colors.inputBg }} />
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                variant="outlined"
                color="primary"
                shape="rounded"
                sx={{
                  "& .MuiPaginationItem-root": {
                    border: "none",
                    color: colors.text,
                  },
                }}
              />
            </Box>
          </>
        )}

        {showClearAllFiltersButton && (
          <>
            <Divider
              sx={{ my: 2, backgroundColor: colors.inputBg }}
              orientation="horizontal"
            />

            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                mb: 2,
                borderRadius: 2,
                textTransform: "none",
                backgroundColor: colors.inputBg,
              }}
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("All Categories");
                setAmountFilter("All Amounts");
                setDateFilter("All Dates");
                setCategoryAnchor(null);
                setAmountAnchor(null);
                setDateAnchor(null);
              }}
            >
              Clear All Filters
            </Button>
          </>
        )}

        {/* Filter Menus */}
        <SearchMenuCard
          anchorEl={categoryAnchor}
          open={Boolean(categoryAnchor)}
          onClose={() => setCategoryAnchor(null)}
          menuItems={["All Categories", ...categories.map((c) => c.raw_name)]}
          displayValue={categories.find(c => c.name === categoryFilter)?.raw_name || categoryFilter}
          setValue={(rawName) => {
            if (rawName === "All Categories") {
              setCategoryFilter("All Categories");
            } else {
              const category = categories.find(c => c.raw_name === rawName);
              if (category) {
                setCategoryFilter(category.name);
              }
            }
          }}
          value={categoryFilter}
          setAnchor={setCategoryAnchor}
        />

        <SearchMenuCard
          anchorEl={amountAnchor}
          open={Boolean(amountAnchor)}
          onClose={() => setAmountAnchor(null)}
          menuItems={[
            "All Amounts",
            "Under $10",
            "$10 - $50",
            "$50 - $100",
            "Over $100",
          ]}
          setValue={setAmountFilter}
          value={amountFilter}
          setAnchor={setAmountAnchor}
        />

        <SearchMenuCard
          anchorEl={dateAnchor}
          open={Boolean(dateAnchor)}
          onClose={() => setDateAnchor(null)}
          menuItems={[
            "All Dates",
            "Today",
            "Yesterday",
            "This Week",
            "This Month",
          ]}
          setValue={setDateFilter}
          value={dateFilter}
          setAnchor={setDateAnchor}
        />
      </CardContent>
    </Card>
  );
}
