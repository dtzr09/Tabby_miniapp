import { useCallback, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { useQueryClient } from "@tanstack/react-query";
import { refetchExpensesQueries } from "../../../utils/refetchExpensesQueries";
import { TelegramUser } from "../../dashboard";
import { TelegramWebApp } from "../../../utils/types";

interface DeleteExpenseDialogProps {
  id: number;
  isIncome?: boolean;
  onSuccess: () => void;
  showConfirm: boolean;
  setShowConfirm: (show: boolean) => void;
  tgUser: TelegramUser | null;
}

export default function DeleteExpenseDialog({
  id,
  isIncome,
  onSuccess,
  showConfirm,
  setShowConfirm,
  tgUser,
}: DeleteExpenseDialogProps) {
  const { colors } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = useCallback(async () => {
    if (!tgUser) return;

    try {
      setIsDeleting(true);
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      const initData = webApp?.initData;

      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: tgUser.id.toString(),
          initData,
          isIncome,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      await refetchExpensesQueries(queryClient, tgUser.id.toString());
      onSuccess();
    } catch (error) {
      console.error("Error deleting entry:", error);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }, [id, isIncome, onSuccess, setShowConfirm, tgUser, queryClient]);

  return (
    <Dialog
      open={showConfirm}
      onClose={() => !isDeleting && setShowConfirm(false)}
      PaperProps={{
        sx: {
          bgcolor: colors.card,
          color: colors.text,
          borderRadius: 3,
          width: "90%",
          maxWidth: "400px",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: colors.text,
          fontSize: "1.1rem",
          fontWeight: 600,
          pt: 3,
          textAlign: "center",
        }}
      >
        Delete {isIncome ? "Income" : "Expense"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{
            color: colors.textSecondary,
            textAlign: "center",
            fontSize: "0.9rem",
          }}
        >
          Are you sure you want to delete this {isIncome ? "income" : "expense"}? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: "center",
          gap: 1,
          pb: 3,
          px: 3,
        }}
      >
        <Button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          sx={{
            color: colors.text,
            bgcolor: colors.inputBg,
            textTransform: "none",
            width: "100%",
            "&:hover": {
              bgcolor: colors.surface,
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          sx={{
            color: colors.text,
            bgcolor: colors.expense,
            textTransform: "none",
            width: "100%",
            "&:hover": {
              bgcolor: colors.expense,
              opacity: 0.9,
            },
          }}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
