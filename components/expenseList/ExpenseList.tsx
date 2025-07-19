import {
  List,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Button,
  alpha,
  IconButton,
  TextField,
  Collapse,
  Tooltip,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useState } from "react";

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

interface ExpenseListProps {
  expenses: Expense[];
}

export default function ExpenseList({ expenses }: ExpenseListProps) {
  const { colors } = useTheme();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use sample data if no expenses provided, otherwise use provided expenses
  const transactionsToUse = expenses.length > 0 ? expenses : [];

  // Get recent transactions (last 4) and filter by search query
  const recentTransactions = transactionsToUse
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((exp) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        exp.description.toLowerCase().includes(query) ||
        (exp.category?.name || "Other").toLowerCase().includes(query)
      );
    })
    .slice(0, 5)
    .map((exp) => ({
      description: exp.description,
      category: exp.category?.name || "Other",
      date: new Date(exp.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      amount: exp.amount,
      isIncome: exp.is_income,
    }));

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery("");
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

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
      <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              sx={{
                bgcolor: colors.surface,
                color: colors.primary,
                width: 30,
                height: 30,
                mr: 1,
              }}
            >
              <AccessTimeIcon />
            </Avatar>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: colors.text,
                fontSize: "1.2rem",
                letterSpacing: "-.025em",
              }}
            >
              Recent Spendings
            </Typography>
          </Box>
          <IconButton
            onClick={handleSearchToggle}
            sx={{
              color: colors.textSecondary,
              p: 0.5,
              "&:hover": {
                color: colors.primary,
                bgcolor: alpha(colors.primary, 0.1),
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            {isSearchExpanded ? <CloseIcon /> : <SearchIcon />}
          </IconButton>
        </Box>

        {/* Search Input */}
        <Collapse in={isSearchExpanded}>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover fieldset": {
                    border: `1px solid ${colors.primary}`,
                  },
                  "&.Mui-focused fieldset": {
                    border: `2px solid ${colors.primary}`,
                  },
                },
                "& .MuiInputBase-input": {
                  color: colors.text,
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  "&::placeholder": {
                    color: colors.textSecondary,
                    opacity: 0.7,
                  },
                },
              }}
            />
          </Box>
        </Collapse>

        <List sx={{ width: "100%", p: 0 }}>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx, idx) => {
              const isIncome = tx.isIncome;
              return (
                <Box
                  key={idx}
                  sx={{
                    bgcolor: colors.incomeExpenseCard,
                    borderRadius: 3,
                    mb: 1.5,
                    px: 2,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          color: colors.text,
                          mb: 0.8,
                        }}
                      >
                        {tx.description}
                      </Typography>
                      <Typography
                        sx={{
                          color: colors.textSecondary,
                          fontSize: "0.7rem",
                          fontWeight: 500,
                        }}
                      >
                        {tx.category} • {tx.date}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: isIncome ? colors.income : colors.expense,
                      fontSize: "1rem",
                    }}
                  >
                    {isIncome ? "+" : "-"}
                    {Math.abs(tx.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
              );
            })
          ) : (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                color: colors.textSecondary,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  opacity: 0.8,
                }}
              >
                {searchQuery.trim()
                  ? "No transactions found"
                  : "No transactions yet"}
              </Typography>
            </Box>
          )}
        </List>
        <Tooltip title="Coming soon">
          <span>
            <Button
              variant="contained"
              href="/advanced-search"
              disabled={true}
              sx={{
                mt: 3,
                width: "100%",
                bgcolor: colors.primary,
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.9rem",
                borderRadius: 2,
                textTransform: "none",
                boxShadow: 0,
                py: 1.2,
                "&:hover": {
                  bgcolor: colors.accent,
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              Advanced Search
            </Button>
          </span>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
