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
import { AllEntriesResponse, UnifiedEntry } from "../../../utils/types";
import { TelegramUser } from "../../dashboard";

interface ExpenseListProps {
  allEntries: AllEntriesResponse;
  tgUser: TelegramUser | null;
}

export default function ExpenseList({ allEntries, tgUser }: ExpenseListProps) {
  const { colors } = useTheme();
  const [showSearchCard, setShowSearchCard] = useState(false);

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
          emoji: undefined, // Income doesn't have emoji in the current structure
          date: income.date,
          amount: income.amount,
          isIncome: true,
        });
      });
    }

    // Sort by date (newest first)
    return combined.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const unifiedEntries = combineEntries();

  // Get recent transactions (last 5)
  const recentTransactions = unifiedEntries.slice(0, 5);

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
        entries={unifiedEntries}
        onBack={handleBackFromSearch}
        tgUser={tgUser}
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
              Recent Transactions
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
          <ExpenseListCard entries={recentTransactions} tgUser={tgUser} />
        </List>
      </CardContent>
    </Card>
  );
}
