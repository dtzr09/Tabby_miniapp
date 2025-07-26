import React from "react";
import { alpha, Box, Typography } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/router";
import { displayDateTime } from "../../utils/displayDateTime";

export interface ExpenseListCardProps {
  expenses: {
    id: number;
    description: string;
    category: string;
    emoji?: string;
    date: string;
    amount: number;
    isIncome: boolean;
  }[];
}

const ExpenseListCard = (props: ExpenseListCardProps) => {
  const { colors } = useTheme();
  const router = useRouter();
  if (props.expenses.length === 0) {
    return (
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
          No transactions found
        </Typography>
      </Box>
    );
  }

  return props.expenses.map((tx, idx) => {
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
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            bgcolor: alpha(colors.primary, 0.08),
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            border: `1px solid ${alpha(colors.primary, 0.3)}`,
          },
        }}
        onClick={() => {
          router.push(`/expenses/${tx.id}`);
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
              {tx.category} • {displayDateTime({ date: tx.date })}
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
  });
};

export default ExpenseListCard;
