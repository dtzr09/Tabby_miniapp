import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { deleteExpense } from "../../../services/expenses";
import { useTheme } from "@/contexts/ThemeContext";
import { useQueryClient } from "@tanstack/react-query";
import { refetchExpensesQueries } from "../../../utils/refetchExpensesQueries";
import { TelegramUser } from "../../dashboard";
import { QueryObserverResult } from "@tanstack/react-query";
import { AllEntriesResponse } from "../../../utils/types";

export interface DeleteExpenseDialogProps {
  id: number;
  onSuccess: () => void;
  showConfirm: boolean;
  setShowConfirm: (show: boolean) => void;
  tgUser: TelegramUser | null;
}

const DeleteExpenseDialog = ({
  id,
  onSuccess,
  showConfirm,
  setShowConfirm,
  tgUser,
}: DeleteExpenseDialogProps) => {
  const { colors, fontFamily } = useTheme();
  const queryClient = useQueryClient();

  return (
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
          Delete Transaction
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ color: colors.text }}>
        <Typography sx={{ fontSize: "1rem", fontWeight: 500 }}>
          Are you sure you want to delete this transaction?
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
          onClick={async () => {
            try {
              await deleteExpense(id);

              if (tgUser) {
                await refetchExpensesQueries(queryClient, tgUser.id.toString());
              }

              onSuccess();
            } catch (err) {
              console.error("Error deleting expense:", err);
            } finally {
              setShowConfirm(false); // Always close the confirmation, even if error
            }
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
            Delete
          </Typography>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteExpenseDialog;
