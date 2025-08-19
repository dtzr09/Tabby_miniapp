import React from "react";
import { Box, List, Typography, Stack, Divider } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import ExpenseRow from "./ExpenseRow";
import { UnifiedEntry } from "../../../utils/types";
import { TelegramUser } from "../../dashboard";

export interface ExpenseListCardProps {
  entries: UnifiedEntry[];
  tgUser: TelegramUser | null;
  isGroupView?: boolean;
}

interface GroupedEntries {
  [key: string]: {
    title: string;
    entries: UnifiedEntry[];
    netAmount: number;
  };
}

const ExpenseListCard = (props: ExpenseListCardProps) => {
  const { colors } = useTheme();

  const groupEntriesByDate = (entries: UnifiedEntry[]): GroupedEntries => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const grouped: GroupedEntries = {};

    entries.forEach((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      let key: string;
      let title: string;

      if (entryDate.getTime() === today.getTime()) {
        key = "today";
        title = "Today";
      } else if (entryDate.getTime() === yesterday.getTime()) {
        key = "yesterday";
        title = "Yesterday";
      } else {
        key = entryDate.toISOString().split("T")[0];
        const day = entryDate
          .toLocaleDateString("en-US", { weekday: "short" })
          .toUpperCase();
        const month = entryDate
          .toLocaleDateString("en-US", { month: "short" })
          .toUpperCase();
        const date = entryDate.getDate();
        title = `${day}, ${date} ${month} `;
      }

      if (!grouped[key]) {
        grouped[key] = {
          title,
          entries: [],
          netAmount: 0,
        };
      }

      grouped[key].entries.push(entry);
      // Add to net amount (positive for income, negative for expenses)
      // For personal shares, use the share amount; for regular expenses, use the full amount
      const amountToAdd = entry.isIncome ? entry.amount : -entry.amount;
      grouped[key].netAmount += amountToAdd;
    });

    return grouped;
  };

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

  const groupedEntries = groupEntriesByDate(props.entries);
  const sortedDates = Object.keys(groupedEntries).sort((a, b) => {
    // Ensure "today" and "yesterday" come first
    if (a === "today") return -1;
    if (b === "today") return 1;
    if (a === "yesterday") return -1;
    if (b === "yesterday") return 1;
    // Sort other dates in descending order
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <List sx={{ width: "100%", p: 0 }}>
      {sortedDates.map((date) => (
        <React.Fragment key={date}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              px: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: colors.textSecondary,
              }}
            >
              {groupedEntries[date].title}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                letterSpacing: ".015em",
                color: colors.textSecondary,
              }}
            >
              {groupedEntries[date].netAmount >= 0 ? "+" : "-"}$
              {Math.abs(groupedEntries[date].netAmount).toFixed(2)}
            </Typography>
          </Stack>
          <Divider
            sx={{
              borderBottomWidth: 0.5,
              borderColor: colors.textSecondary,
              mt: 0.2,
              mb: 1,
              mx: 1,
            }}
          />
          {groupedEntries[date].entries.map((tx) => (
            <ExpenseRow key={tx.id} tx={tx} tgUser={props.tgUser} isGroupView={props.isGroupView} />
          ))}
          <Box sx={{ mb: 2}} />
        </React.Fragment>
      ))}
    </List>
  );
};

export default ExpenseListCard;
