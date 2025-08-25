import React from "react";
import BottomSheet from "../../common/BottomSheet";
import SplitInfoTooltip from "../../common/SplitInfoTooltip";
import { Expense, ExpenseShare } from "../../../utils/types";
import { CallSplit, GraphicEq } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { Box, Typography } from "@mui/material";
import { Button } from "@mui/material";
import SplitExpense from "../../expenseShare/SplitExpense";

interface SplitExpenseBottomSheetProps {
  showSplitExpenseSheet: boolean;
  setShowSplitExpenseSheet: (show: boolean) => void;
  splitHasChanges: boolean;
  setSplitHasChanges: (hasChanges: boolean) => void;
  setEditExpenseShare: (edit: boolean) => void;
  handleSplitApplyChanges: () => void;
  handleSplitModeToggle: () => void;
  resetSplitChanges: () => void;
  splitValidationErrors: Record<string, string>;
  expenseShares: ExpenseShare[];
  expense: Expense | undefined;
  currentAmount: string;
  displayAmount: string;
  isExpense: boolean;
  isCustomSplit: boolean;
  splitInputValues: Record<string | number, string>;
  setSplitInputValues: (values: Record<string | number, string>) => void;
  setSplitValidationErrors: (errors: Record<string, string>) => void;
  isDirty: boolean;
}
const SplitExpenseBottomSheet = (props: SplitExpenseBottomSheetProps) => {
  const { colors } = useTheme();
  return (
    <BottomSheet
      open={props.showSplitExpenseSheet}
      onClose={() => {
        props.setShowSplitExpenseSheet(false);
        // Reset all split changes when closing the sheet without saving
        props.resetSplitChanges();
      }}
      title="Split Expense"
      titleIcon={
        <SplitInfoTooltip
          expense={
            props.expense
              ? { ...props.expense, shares: props.expenseShares }
              : undefined
          }
          currentAmount={props.currentAmount}
        />
      }
      description={`$${parseFloat(props.displayAmount).toFixed(2)}  •  ${
        props.isExpense && props.expenseShares && props.expenseShares.length
      } people`}
      buttons={[
        {
          text: "Save",
          onClick: props.handleSplitApplyChanges,
          disabled: !props.isDirty,
          variant: "primary",
        },
      ]}
      actionButtons={
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Edit/Equal Split Toggle Button */}
          <Button
            onClick={props.handleSplitModeToggle}
            sx={{
              color: colors.text,
              textTransform: "none",
              borderRadius: 6,
              backgroundColor: colors.border,
              p: 1,
            }}
          >
            {props.isCustomSplit ? (
              <GraphicEq
                fontSize="small"
                sx={{
                  mr: 0.5,
                  fontSize: "0.9rem",
                  color: colors.text,
                }}
              />
            ) : (
              <CallSplit
                fontSize="small"
                sx={{
                  mr: 0.5,
                  fontSize: "0.9rem",
                  color: colors.text,
                }}
              />
            )}

            <Typography
              variant="body2"
              sx={{
                fontSize: "0.8rem",
                letterSpacing: 1,
                fontWeight: 550,
              }}
            >
              {props.isCustomSplit ? "Split Evenly" : "Custom Split"}
            </Typography>
          </Button>
        </Box>
      }
    >
      {props.expense && (
        <SplitExpense
          expense={{ ...props.expense, shares: props.expenseShares }}
          isCustomSplit={props.isCustomSplit}
          currentAmount={props.currentAmount}
          onValidationChange={props.setSplitValidationErrors}
          onHasChangesChange={props.setSplitHasChanges}
          onInputValuesChange={props.setSplitInputValues}
        />
      )}
    </BottomSheet>
  );
};

export default SplitExpenseBottomSheet;
