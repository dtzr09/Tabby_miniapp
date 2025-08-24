import { Box, Divider, Typography } from "@mui/material";
import { Expense, ExpenseShare } from "../../utils/types";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect, useMemo, useCallback } from "react";

import UserShare from "./UserShare";

interface SplitExpenseProps {
  expense: Expense;
  editExpenseShare: boolean;
  currentAmount?: string;
  onSplitTypeChange?: (isCustomSplit: boolean) => void;
  onValidationChange?: (errors: Record<string | number, string>) => void;
  onHasChangesChange?: (hasChanges: boolean) => void;
  onInputValuesChange?: (inputValues: Record<string | number, string>) => void;
}

const SplitExpense = ({
  expense,
  editExpenseShare,
  currentAmount,
  onSplitTypeChange,
  onValidationChange,
  onHasChangesChange,
  onInputValuesChange,
}: SplitExpenseProps) => {
  const { colors } = useTheme();

  // Use currentAmount if provided, otherwise fall back to expense.amount
  const totalAmount = currentAmount
    ? parseFloat(currentAmount)
    : expense.amount;
  const amountPerPerson = expense.shares?.length
    ? totalAmount / expense.shares?.length
    : totalAmount;

  // Local state for shares to handle optimistic updates
  const [localShares, setLocalShares] = useState<ExpenseShare[]>(
    expense.shares || []
  );

  // Track input values and validation errors
  const [inputValues, setInputValues] = useState<
    Record<string | number, string>
  >({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string | number, string>
  >({});
  const [hasChanges, setHasChanges] = useState(false);

  // Notify parent component of changes
  useEffect(() => {
    onValidationChange?.(validationErrors);
  }, [validationErrors, onValidationChange]);

  useEffect(() => {
    onHasChangesChange?.(hasChanges);
  }, [hasChanges, onHasChangesChange]);

  useEffect(() => {
    onInputValuesChange?.(inputValues);
  }, [inputValues, onInputValuesChange]);

  // Initialize input values when expense changes
  useEffect(() => {
    if (expense.shares) {
      setLocalShares(expense.shares);
      const newInputValues: Record<string | number, string> = {};
      expense.shares.forEach((share) => {
        newInputValues[share.user_id] = share.share_amount.toFixed(2);
      });
      setInputValues(newInputValues);
      setValidationErrors({});
      setHasChanges(false);
    }
  }, [expense.shares]);

  // Check if current state is equal split
  const isEqualSplit = useMemo(() => {
    if (!localShares.length) return true;
    const expectedAmount = totalAmount / localShares.length;
    return localShares.every(
      (share) => Math.abs(share.share_amount - expectedAmount) < 0.01
    );
  }, [localShares, totalAmount]);

  // Notify parent component when split type changes
  useEffect(() => {
    onSplitTypeChange?.(!isEqualSplit);
  }, [isEqualSplit, onSplitTypeChange]);

  // Memoized handlers to prevent recreation
  const handleInputChange = useCallback(
    (userId: string | number, rawValue: string) => {
      // Update input values
      setInputValues((prev) => ({
        ...prev,
        [userId]: rawValue,
      }));

      // Validate the input
      const numericValue = parseFloat(rawValue);

      setValidationErrors((prevErrors) => {
        const newErrors = { ...prevErrors };

        if (rawValue.trim() === "") {
          newErrors[userId] = "Amount cannot be empty";
        } else if (isNaN(numericValue) || numericValue < 0) {
          newErrors[userId] = "Please enter a valid positive number";
        } else if (rawValue.includes("e") || rawValue.includes("E")) {
          // Prevent scientific notation
          newErrors[userId] = "Please enter a valid positive number";
        } else if (!/^[0-9]*\.?[0-9]*$/.test(rawValue)) {
          // Only allow numbers and decimal point
          newErrors[userId] = "Please enter a valid positive number";
        } else {
          delete newErrors[userId];
        }

        return newErrors;
      });

      setHasChanges(true);
    },
    []
  );

  const handleInputBlur = useCallback(
    (userId: string | number) => {
      const inputValue = inputValues[userId];
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue) && numericValue >= 0) {
        setInputValues((prev) => ({
          ...prev,
          [userId]: numericValue.toFixed(2),
        }));
      }
    },
    [inputValues]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Divider sx={{ width: "100%", my: 1, borderColor: colors.border }} />
      {!editExpenseShare && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            position: "relative",
          }}
        >
          <Typography variant="h4" color={colors.text}>
            ${amountPerPerson.toFixed(2)}
          </Typography>
          <Typography variant="body2" color={colors.textSecondary}>
            per person
          </Typography>
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
        {localShares.map((share) => (
          <UserShare
            key={share.user_id}
            share={share}
            inputValue={
              inputValues[share.user_id] || share.share_amount.toFixed(2)
            }
            hasError={validationErrors[share.user_id]}
            editExpenseShare={editExpenseShare}
            amountPerPerson={amountPerPerson}
            onInputChange={handleInputChange}
            onInputBlur={handleInputBlur}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SplitExpense;
