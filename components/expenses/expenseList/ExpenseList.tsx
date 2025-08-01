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
import { TelegramUser } from "../../dashboard";
import { useQuery } from "@tanstack/react-query";
import { fetchExpenses } from "../../../services/expenses";

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
  initData: string | null;
  tgUser: TelegramUser | null;
}

export default function ExpenseList({ initData, tgUser }: ExpenseListProps) {
  const { colors } = useTheme();
  const [showSearchCard, setShowSearchCard] = useState(false);

  const {
    data: expenses,
    // isLoading: isExpensesLoading,
    refetch: refetchExpenses,
  } = useQuery<Expense[]>({
    queryKey: ["expenses", tgUser?.id],
    queryFn: () => {
      if (tgUser && initData) {
        return fetchExpenses(tgUser.id, initData);
      }
      return Promise.resolve([]);
    },
    enabled: !!tgUser && !!initData,
    staleTime: 30000, // Data stays fresh for 30 seconds
    gcTime: 300000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // Use empty array if no expenses provided
  const transactionsToUse = expenses ?? [];

  // Get recent transactions (last 5)
  const recentTransactions = Array.isArray(transactionsToUse)
    ? transactionsToUse
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((exp) => ({
          id: exp.id,
          description: exp.description,
          category: exp.category?.name || "Other",
          date: exp.date, // Keep the original date string
          amount: exp.amount,
          isIncome: exp.is_income,
        }))
    : [];

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
        expenses={transactionsToUse}
        onBack={handleBackFromSearch}
        onRefetch={refetchExpenses}
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
          <ExpenseListCard
            expenses={recentTransactions}
            onRefetch={refetchExpenses}
          />
        </List>
      </CardContent>
    </Card>
  );
}
