import { useSwipeable } from "react-swipeable";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/router";
import { Box, Typography, alpha } from "@mui/material";
import React, { useState } from "react";
import { ExpenseListCardProps } from "./ExpenseListCard";
import DeleteExpenseDialog from "../utils/DeleteExpenseDialog";
import { displayDateTime } from "../../../utils/displayDateTime";

const ExpenseRow = ({
  tx,
  onRefetch,
}: {
  tx: ExpenseListCardProps["expenses"][0];
  onRefetch: () => void;
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => setShowDelete(true),
    onSwipedRight: () => setShowDelete(false),
    trackTouch: true,
  });
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <Box {...handlers}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        {showDelete && (
          <Box
            onClick={() => {
              setShowConfirm(true);
            }}
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              position: "absolute",
              right: 10,
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
            <DeleteIcon />
          </Box>
        )}
        <DeleteExpenseDialog
          id={tx.id}
          onSuccess={() => {
            setShowDelete(false);
            onRefetch();
          }}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
        />
        {/* Main card */}
        <Box
          sx={{
            transform: showDelete ? "translateX(-80px)" : "translateX(0)",
            transition: "transform 0.2s ease",
            position: "relative",
            zIndex: 2,
            bgcolor: colors.incomeExpenseCard,
            borderRadius: 3,
            mb: 1.5,
            px: 2,
            py: 2,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            "&:hover": {
              bgcolor: alpha(colors.primary, 0.08),
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              border: `1px solid ${alpha(colors.primary, 0.3)}`,
            },
          }}
          onClick={() => router.push(`/expenses/${tx.id}`)}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
              color: tx.isIncome ? colors.income : colors.expense,
              fontSize: "1rem",
            }}
          >
            {tx.isIncome ? "+" : "-"}
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
