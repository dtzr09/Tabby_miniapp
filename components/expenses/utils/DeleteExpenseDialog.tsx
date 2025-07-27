import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { handleDelete } from "../../../services/expenses";
import { useTheme } from "@/contexts/ThemeContext";

export interface DeleteExpenseDialogProps {
  id: number;
  onSuccess: () => void;
  showConfirm: boolean;
  setShowConfirm: (show: boolean) => void;
}

const DeleteExpenseDialog = ({
  id,
  onSuccess,
  showConfirm,
  setShowConfirm,
}: DeleteExpenseDialogProps) => {
  const { colors, fontFamily } = useTheme();

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
          onClick={() =>
            handleDelete(id, () => {
              setShowConfirm(false);
              onSuccess();
            })
          }
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
