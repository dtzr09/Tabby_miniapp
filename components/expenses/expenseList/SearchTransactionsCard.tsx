import {
  List,
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
import { useEffect, useRef, useState } from "react";
import SearchMenuCard from "./SearchMenuCard";
import FilterOptionCard from "./FilterOptionCard";
import ExpenseListCard from "./ExpenseListCard";
import Pagination from "@mui/material/Pagination";
import { QueryObserverResult } from "@tanstack/react-query";

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

interface SearchTransactionsCardProps {
  expenses: Expense[];
  onBack: () => void;
  onRefetch: () => Promise<QueryObserverResult<Expense[], Error>>;
}

export default function SearchTransactionsCard({
  expenses,
  onBack,
  onRefetch,
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

  // Get unique categories from expenses
  const categories = Array.from(
    new Set(
      expenses.map((exp) => {
        const categoryName = exp.category?.name || "Other";
        // Remove emoji from category name and trim
        const cleanName = categoryName
          .replace(
            /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]\s*/u,
            ""
          )
          .trim();
        return cleanName || "Other";
      })
    )
  );

  // Filter transactions based on search and filters
  const filteredTransactions = expenses
    .filter((exp) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const categoryName = exp.category?.name || "Other";
        // Extract clean category name (without emoji) for search
        const cleanCategoryName =
          categoryName
            .replace(
              /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]\s*/u,
              ""
            )
            .trim() || "Other";
        const matchesSearch =
          exp.description.toLowerCase().includes(query) ||
          cleanCategoryName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== "All Categories") {
        const categoryName = exp.category?.name || "Other";
        // Extract clean category name (without emoji)
        const cleanCategoryName =
          categoryName
            .replace(
              /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]\s*/u,
              ""
            )
            .trim() || "Other";
        if (cleanCategoryName !== categoryFilter) {
          return false;
        }
      }

      // Amount filter (simplified for now)
      if (amountFilter !== "All Amounts") {
        const amount = Math.abs(exp.amount);
        switch (amountFilter) {
          case "Under $10":
            if (amount >= 10) return false;
            break;
          case "$10 - $50":
            if (amount < 10 || amount > 50) return false;
            break;
          case "$50 - $100":
            if (amount < 50 || amount > 100) return false;
            break;
          case "Over $100":
            if (amount <= 100) return false;
            break;
        }
      }

      // Date filter (simplified for now)
      if (dateFilter !== "All Dates") {
        const expDate = new Date(exp.date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);

        switch (dateFilter) {
          case "Today":
            if (expDate.toDateString() !== today.toDateString()) return false;
            break;
          case "Yesterday":
            if (expDate.toDateString() !== yesterday.toDateString())
              return false;
            break;
          case "This Week":
            if (expDate < weekAgo) return false;
            break;
          case "This Month":
            if (expDate < monthAgo) return false;
            break;
        }
      }

      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((exp) => ({
      id: exp.id,
      description: exp.description,
      category: exp.category?.name || "Other",
      emoji: exp.category?.emoji || "⚪",
      date: exp.date,
      amount: exp.amount,
      isIncome: exp.is_income,
    }));

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
  const paginatedTransactions = filteredTransactions
    .slice((page - 1) * transactionsPerPage, page * transactionsPerPage)
    .map((exp) => ({
      id: exp.id,
      description: exp.description,
      category: exp.category,
      emoji: exp.emoji,
      date: exp.date,
      amount: exp.amount,
      isIncome: exp.isIncome,
    }));

  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter, amountFilter, dateFilter]);

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
        <List sx={{ width: "100%", p: 0 }}>
          <ExpenseListCard
            expenses={paginatedTransactions}
            onRefetch={onRefetch}
          />
        </List>
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
          menuItems={["All Categories", ...categories]}
          setValue={setCategoryFilter}
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
