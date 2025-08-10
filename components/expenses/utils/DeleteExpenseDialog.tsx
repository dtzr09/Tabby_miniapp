import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { TelegramUser } from "../../dashboard";
import { useTheme } from "@/contexts/ThemeContext";
import { TelegramWebApp } from "../../../utils/types";
import { showPopup } from "@telegram-apps/sdk";

interface DeleteExpenseDialogProps {
  id: number;
  isIncome: boolean;
  onSuccess: () => void;
  showConfirm: boolean;
  setShowConfirm: (show: boolean) => void;
  tgUser: TelegramUser | null;
  deleteFromCache?: () => void;
}

export default function DeleteExpenseDialog({
  id,
  isIncome,
  onSuccess,
  showConfirm,
  setShowConfirm,
  deleteFromCache,
}: DeleteExpenseDialogProps) {
  const { colors } = useTheme();

  const handleDelete = async () => {
    try {
      // Optimistically update cache and UI
      if (deleteFromCache) {
        deleteFromCache();
      }

      // Call onSuccess immediately for better UX
      onSuccess();
      setShowConfirm(false);

      // Make the API call in the background
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      const user = webApp?.initDataUnsafe?.user;
      const initData = webApp?.initData;

      if (!user?.id || !initData) {
        throw new Error("Missing Telegram data");
      }

      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegram_id: user.id.toString(),
          initData,
          isIncome,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      // Show error message but don't revert UI since we already navigated
      showPopup({
        title: "Error",
        message: "Failed to delete. Please refresh the page.",
        buttons: [{ type: "ok" }],
      });
    }
  };

  return (
    <Dialog
      open={showConfirm}
      onClose={() => setShowConfirm(false)}
      PaperProps={{
        sx: {
          backgroundColor: colors.background,
          color: colors.text,
        },
      }}
    >
      <DialogTitle sx={{ color: colors.text }}>
        Delete {isIncome ? "Income" : "Expense"}
      </DialogTitle>
      <DialogContent>
        <div style={{ color: colors.text }}>
          Are you sure you want to delete this {isIncome ? "income" : "expense"}
          ?
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => setShowConfirm(false)}
          sx={{ color: colors.text }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          sx={{
            color: colors.text,
            backgroundColor: colors.expense,
            "&:hover": {
              backgroundColor: colors.expenseBg,
            },
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
