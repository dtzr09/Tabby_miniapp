import { Box, Divider, Typography } from "@mui/material";
import { Expense, ExpenseShare, User } from "../../utils/types";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { divideAmountEvenly } from "../../utils/currencyUtils";

import UserShare from "./UserShare";

interface SplitExpenseProps {
  expense: Expense;
  currentAmount?: string;
  onSplitTypeChange?: (isCustomSplit: boolean) => void;
  onValidationChange?: (errors: Record<string | number, string>) => void;
  onHasChangesChange?: (hasChanges: boolean) => void;
  onInputValuesChange?: (inputValues: Record<string | number, string>) => void;
  isCustomSplit: boolean;
  isPersonalExpensePaidByOthers: boolean;
  payerUser: User | null;
}

const SplitExpense = ({
  expense,
  currentAmount,
  isCustomSplit,
  onSplitTypeChange,
  onValidationChange,
  onHasChangesChange,
  onInputValuesChange,
  isPersonalExpensePaidByOthers,
  payerUser,
}: SplitExpenseProps) => {
  const { colors } = useTheme();

  // Use currentAmount if provided, otherwise fall back to expense.amount
  const totalAmount = currentAmount
    ? parseFloat(currentAmount)
    : expense.amount;
  const amountPerPerson = expense.shares?.length
    ? divideAmountEvenly(totalAmount, expense.shares.length)
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
      // Sort shares so payer appears first
      const sortedShares = [...expense.shares].sort((a, b) => {
        // If no payer_id is set, maintain original order
        if (!expense.payer_id) return 0;

        const aIsPayer = a.user_id === expense.payer_id;
        const bIsPayer = b.user_id === expense.payer_id;
        if (aIsPayer && !bIsPayer) return -1;
        if (!aIsPayer && bIsPayer) return 1;
        return 0;
      });

      setLocalShares(sortedShares);
      const newInputValues: Record<string | number, string> = {};
      sortedShares.forEach((share) => {
        newInputValues[share.user_id] = share.share_amount.toFixed(2);
      });
      setInputValues(newInputValues);
      setValidationErrors({});
      setHasChanges(false);
    }
  }, [expense.shares, expense.payer_id]);

  // Check if current state is equal split
  const isEqualSplit = useMemo(() => {
    if (!localShares.length) return true;
    const expectedAmount = divideAmountEvenly(totalAmount, localShares.length);
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
      {!isCustomSplit && (
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
        {payerUser && isPersonalExpensePaidByOthers && (
          <Typography
            variant="body2"
            color={colors.textSecondary}
            sx={{
              textAlign: "center",
            }}
          >
            This expense is paid by {payerUser.name} (@{payerUser.username})
          </Typography>
        )}
        {localShares.map((share) => (
          <UserShare
            key={share.user_id}
            share={share}
            inputValue={
              inputValues[share.user_id] || share.share_amount.toFixed(2)
            }
            hasError={validationErrors[share.user_id]}
            isCustomSplit={isCustomSplit}
            amountPerPerson={amountPerPerson}
            onInputChange={handleInputChange}
            onInputBlur={handleInputBlur}
            isPayer={!!expense.payer_id && share.user_id === expense.payer_id}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SplitExpense;
