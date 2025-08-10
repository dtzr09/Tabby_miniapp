import { useSwipeable } from "react-swipeable";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/router";
import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import DeleteExpenseDialog from "../utils/DeleteExpenseDialog";
import { displayDateTime } from "../../../utils/displayDateTime";
import { UnifiedEntry } from "../../../utils/types";
import { TelegramUser } from "../../dashboard";
import { alpha } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import { refetchExpensesQueries } from "../../../utils/refetchExpensesQueries";

const ExpenseRow = ({
  tx,
  tgUser,
}: {
  tx: UnifiedEntry;
  tgUser: TelegramUser | null;
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const handlers = useSwipeable({
    onSwipedLeft: () => setShowDelete(true),
    onSwipedRight: () => setShowDelete(false),
    trackTouch: true,
  });

  const handleDeleteSuccess = () => {
    setShowDelete(false);
    
    // Optimistically update the cache
    if (tgUser) {
      const userId = tgUser.id.toString();
      const queryKeys = [
        ["expensesWithBudget", userId],
        ["allEntries", userId]
      ];

      // Update each query's data optimistically
      queryKeys.forEach(queryKey => {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData;
          
          // Handle both array and object responses
          if (Array.isArray(oldData)) {
            return oldData.filter(item => item.id !== tx.id);
          }
          
          // Handle the allEntries structure
          if (oldData.expenses || oldData.income) {
            return {
              ...oldData,
              expenses: oldData.expenses.filter((e: any) => e.id !== tx.id),
              income: oldData.income.filter((i: any) => i.id !== tx.id)
            };
          }
          
          return oldData;
        });
      });

      // Then trigger a background refetch to ensure consistency
      refetchExpensesQueries(queryClient, userId);
    }
  };

  return (
    <Box {...handlers}>
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        {showDelete && (
          <Box
            onClick={() => setShowConfirm(true)}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              position: "absolute",
              right: 8,
              top: "40%",
              transform: "translateY(-50%)",
              bgcolor: "#e74c3c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
            }}
          >
            <DeleteIcon sx={{ fontSize: "1.2rem" }} />
          </Box>
        )}
        <DeleteExpenseDialog
          id={tx.id}
          onSuccess={handleDeleteSuccess}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
          tgUser={tgUser}
          isIncome={tx.isIncome}
        />

        {/* Main card */}
        <Box
          sx={{
            transform: showDelete ? "translateX(-80px)" : "translateX(0)",
            transition: "transform 0.2s ease",
            position: "relative",
            zIndex: 2,
            bgcolor: "transparent",
            borderRadius: 1.5,
            mb: 0.4,
            px: 1,
            py: 0.7,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
          onClick={() =>
            router.push(`/expenses/${tx.id}?isIncome=${tx.isIncome}`)
          }
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            {/* Category Icon */}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: alpha(colors.text, 0.04),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
              }}
            >
              {tx.emoji || "🏷️"}
            </Box>

            {/* Description and Time */}
            <Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: colors.text,
                  mb: 0.25,
                  lineHeight: 1.2,
                }}
              >
                {tx.description}
              </Typography>
              <Typography
                sx={{
                  color: colors.textSecondary,
                  fontSize: "0.75rem",
                  lineHeight: 1.2,
                }}
              >
                {displayDateTime({ date: tx.date }, true)}
              </Typography>
            </Box>
          </Box>

          {/* Amount */}
          <Typography
            sx={{
              fontWeight: 600,
              color: tx.isIncome ? colors.income : colors.expense,
              fontSize: "0.95rem",
            }}
          >
            {tx.isIncome ? "+" : "-"}$
            {Math.abs(tx.amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ExpenseRow;
