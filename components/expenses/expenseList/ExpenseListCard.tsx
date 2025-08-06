import React from "react";
import { Box, List, Typography } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import ExpenseRow from "./ExpenseRow";
import { UnifiedEntry } from "../../../utils/types";
import { TelegramUser } from "../../dashboard";

export interface ExpenseListCardProps {
  entries: UnifiedEntry[];
  tgUser: TelegramUser | null;
}

const ExpenseListCard = (props: ExpenseListCardProps) => {
  const { colors } = useTheme();

  if (props.entries.length === 0) {
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
      <List sx={{ width: "100%", p: 0 }}>
        {props.entries.map((tx) => (
          <ExpenseRow key={tx.id} tx={tx} tgUser={props.tgUser} />
        ))}
      </List>
    </>
  );
};

export default ExpenseListCard;
