import React from "react";
import { Box, List, Typography } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import ExpenseRow from "./ExpenseRow";
import { TelegramUser } from "../../dashboard";
import { QueryObserverResult } from "@tanstack/react-query";
import { AllEntriesResponse, UnifiedEntry } from "../../../utils/types";

export interface ExpenseListCardProps {
  tgUser: TelegramUser | null;
  entries: UnifiedEntry[];
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
