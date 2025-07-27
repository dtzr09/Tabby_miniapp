import { useSwipeable } from "react-swipeable";
import DeleteIcon from "@mui/icons-material/Delete";
import { displayDateTime } from "../../utils/displayDateTime";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/router";
import {
  Box,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  alpha,
  Dialog,
} from "@mui/material";
import React, { useState } from "react";
import { ExpenseListCardProps } from "./ExpenseListCard";
import { TelegramWebApp } from "../../utils/types";

const ExpenseRow = ({ tx }: { tx: ExpenseListCardProps["expenses"][0] }) => {
  const { colors, fontFamily } = useTheme();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => setShowDelete(true),
    onSwipedRight: () => setShowDelete(false),
    trackTouch: true,
  });
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      const user = webApp.initDataUnsafe?.user;
      const initData = webApp.initData;

      if (!user?.id || !initData) {
        throw new Error("Missing Telegram user/init data");
      }

      const response = await fetch(`/api/expenses/${tx.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegram_id: user.id.toString(),
          initData,
        }),
      });

      router.reload();
      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <Box {...handlers}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
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
        <Dialog
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          disableScrollLock
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              backgroundColor: colors.incomeExpenseCard,
              fontFamily: fontFamily,
              maxWidth: "80%",
            },
          }}
        >
          <DialogTitle sx={{ color: colors.text }}>
            <Typography sx={{ fontSize: "1.2rem", fontWeight: 700 }}>
              Delete Expense
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ color: colors.text }}>
            <Typography sx={{ fontSize: "1rem", fontWeight: 500 }}>
              Are you sure you want to delete this expense?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              sx={{ color: colors.text }}
              onClick={() => setShowConfirm(false)}
            >
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                Cancel
              </Typography>
            </Button>
            <Button
              sx={{ color: colors.expense }}
              color="error"
              onClick={handleDelete}
            >
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                Delete
              </Typography>
            </Button>
          </DialogActions>
        </Dialog>

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
