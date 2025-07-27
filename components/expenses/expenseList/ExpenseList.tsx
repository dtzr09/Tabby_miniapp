import {
  List,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  alpha,
  IconButton,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import SearchTransactionsCard from "./SearchTransactionsCard";
import ExpenseListCard from "./ExpenseListCard";

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
  const [showSearchCard, setShowSearchCard] = useState(false);

  // Use sample data if no expenses provided, otherwise use provided expenses
  const transactionsToUse = expenses.length > 0 ? expenses : [];

  // Get recent transactions (last 5)
  const recentTransactions = transactionsToUse
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((exp) => ({
      id: exp.id,
      description: exp.description,
      category: exp.category?.name || "Other",
      date: exp.date, // Keep the original date string
      amount: exp.amount,
      isIncome: exp.is_income,
    }));

  const handleSearchToggle = () => {
    setShowSearchCard(true);
  };

  const handleBackFromSearch = () => {
    setShowSearchCard(false);
  };

  // Show search card if search is active
  if (showSearchCard) {
    return (
      <SearchTransactionsCard
        expenses={expenses}
        onBack={handleBackFromSearch}
      />
    );
  }

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
            <SearchIcon />
          </IconButton>
        </Box>

        <List sx={{ width: "100%", p: 0 }}>
          <ExpenseListCard expenses={recentTransactions} />
        </List>
      </CardContent>
    </Card>
  );
}
