import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import ExpenseRow from "./ExpenseRow";
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

  return (
    <>
      {props.expenses.map((tx) => (
        <ExpenseRow key={tx.id} tx={tx} />
      ))}
    </>
  );
};

export default ExpenseListCard;
