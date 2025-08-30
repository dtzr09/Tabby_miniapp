import React from "react";
import BottomSheet from "../../common/BottomSheet";
import SplitInfoTooltip from "../../common/SplitInfoTooltip";
import { Expense, ExpenseShare } from "../../../utils/types";
import { CallSplit, GraphicEq } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { Box, Typography } from "@mui/material";
import { Button } from "@mui/material";
import SplitExpense from "../../expenseShare/SplitExpense";
import { useUserById } from "../../../hooks/useUserById";
import { useTelegramWebApp } from "../../../hooks/useTelegramWebApp";

interface SplitExpenseBottomSheetProps {
  showSplitExpenseSheet: boolean;
  setShowSplitExpenseSheet: (show: boolean) => void;
  splitHasChanges: boolean;
  setSplitHasChanges: (hasChanges: boolean) => void;
  setEditExpenseShare: (edit: boolean) => void;
  handleSplitApplyChanges: () => Promise<boolean | undefined>;
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
  const { initData } = useTelegramWebApp();

  // Get payer user information if payer_id exists
  const { data: payerUser } = useUserById(
    props.expense?.payer_id,
    initData,
    props.expense?.chat_id
  );

  const disableSplitModeToggle =
    props.expenseShares.length < 2 &&
    Boolean(
      props.expenseShares.find(
        (share) => share.user_id === props.expense?.payer_id
      )
    );
  const isPersonalExpensePaidByOthers =
    props.expense?.payer_id !== props.expense?.shares?.[0]?.user_id &&
    props.expense?.shares?.length === 1;

  return (
    <BottomSheet
      open={props.showSplitExpenseSheet}
      onClose={() => {
        props.setShowSplitExpenseSheet(false);
        // Only reset split changes if there are unsaved changes
        if (props.splitHasChanges) {
          props.resetSplitChanges();
        }
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
          onClick: () => {
            // Close bottom sheet immediately for better UX
            props.setShowSplitExpenseSheet(false);

            // Handle save in background
            props.handleSplitApplyChanges().catch((error) => {
              console.error("Failed to save split changes:", error);
              // Could show a toast notification here if needed
            });
          },
          disabled: !props.isDirty,
          variant: "primary",
        },
      ]}
      actionButtons={
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Edit/Equal Split Toggle Button */}
          <Button
            onClick={props.handleSplitModeToggle}
            disabled={disableSplitModeToggle || isPersonalExpensePaidByOthers}
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
                  opacity:
                    disableSplitModeToggle || isPersonalExpensePaidByOthers
                      ? 0.1
                      : 1,
                }}
              />
            ) : (
              <CallSplit
                fontSize="small"
                sx={{
                  mr: 0.5,
                  fontSize: "0.9rem",
                  color: colors.text,
                  opacity:
                    disableSplitModeToggle || isPersonalExpensePaidByOthers
                      ? 0.1
                      : 1,
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
          currentAmount={props.isCustomSplit ? props.displayAmount : props.currentAmount}
          onValidationChange={props.setSplitValidationErrors}
          onHasChangesChange={props.setSplitHasChanges}
          onInputValuesChange={props.setSplitInputValues}
          isPersonalExpensePaidByOthers={isPersonalExpensePaidByOthers}
          payerUser={payerUser || null}
        />
      )}
    </BottomSheet>
  );
};

export default SplitExpenseBottomSheet;
