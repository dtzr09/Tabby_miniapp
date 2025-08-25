import { useState, useCallback, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Expense, ExpenseFormData, ExpenseShare } from "../../../../utils/types";
import {
  updateExpenseAmount,
  updateExpenseShares,
} from "../../../../services/expenses";
import { UseFormSetValue } from "react-hook-form";
import { useTelegramWebApp } from "../../../../hooks/useTelegramWebApp";
import { FormValues } from "../EntryForm";

interface UseSplitExpenseProps {
  expense?: Expense;
  isExpense: boolean;
  chat_id?: string;
  currentAmount: string;
  setValue: UseFormSetValue<ExpenseFormData>;
}

export const useSplitExpense = ({
  expense,
  isExpense,
  chat_id,
  currentAmount,
  setValue,
}: UseSplitExpenseProps) => {
  const queryClient = useQueryClient();
  const { user: tgUser, initData } = useTelegramWebApp();

  const originalIsCustomSplit = useMemo(() => {
    if (!isExpense || !expense?.shares?.length) return false;

    const shares = expense.shares;
    if (shares.length <= 1) return false; // Single person can't have custom split

    // Check if all shares are equal (simpler approach)
    const firstShareAmount = shares[0].share_amount;
    const allSharesEqual = shares.every(
      (share: ExpenseShare) =>
        Math.round(share.share_amount * 100) ===
        Math.round(firstShareAmount * 100)
    );

    return !allSharesEqual; // Custom split if shares are NOT all equal
  }, [isExpense, expense]);

  const [isCustomSplit, setIsCustomSplit] = useState(false);

  // Update isCustomSplit when originalIsCustomSplit changes
  useEffect(() => {
    setIsCustomSplit(originalIsCustomSplit);
  }, [originalIsCustomSplit]);

  const [editExpenseShare, setEditExpenseShare] = useState(false);

  // Split expense state
  const [splitValidationErrors, setSplitValidationErrors] = useState<
    Record<string | number, string>
  >({});
  const [splitHasChanges, setSplitHasChanges] = useState(false);
  const [splitInputValues, setSplitInputValues] = useState<
    Record<string | number, string>
  >({});

  // Custom setSplitInputValues that also updates form state
  const handleSplitInputValuesChange = useCallback(
    (values: Record<string | number, string>) => {
      setSplitInputValues(values);

      // Only update the amount field for dirty detection
      if (expense?.shares) {
        const updatedShares = expense.shares.map((share: ExpenseShare) => {
          const inputValue = values[share.user_id];
          const numericValue = parseFloat(inputValue);
          return {
            ...share,
            share_amount: !isNaN(numericValue)
              ? numericValue
              : share.share_amount,
          };
        });

        // Calculate new total amount
        const newTotal = updatedShares.reduce(
          (sum: number, share: ExpenseShare) => sum + share.share_amount,
          0
        );

        // Format the amount consistently with the original defaultValues format
        const formattedAmount = newTotal.toString();

        // Use setValue directly without shouldDirty to let React Hook Form detect if it matches default
        setValue(FormValues.AMOUNT, formattedAmount);
      }
    },
    [expense?.shares, expense?.amount, setValue]
  );

  // Reset split changes back to original values
  const resetSplitChanges = useCallback(() => {
    // Reset split input values
    setSplitInputValues({});

    // Reset form amount back to original value using setValue directly
    if (expense?.amount) {
      const originalAmount = expense.amount.toString();
      setValue(FormValues.AMOUNT, originalAmount);
    }

    // Reset split state
    setSplitHasChanges(false);
    setEditExpenseShare(false);
  }, [expense?.amount, setValue]);

  // Calculate display amount - always use sum of individual shares for consistency
  const displayAmount = useMemo(() => {
    if (isExpense && expense?.shares) {
      // Always calculate total from individual shares for consistency
      const shares = expense.shares;
      const total = shares.reduce((sum, share) => {
        // Always check for input values first, regardless of editExpenseShare state
        if (splitInputValues[share.user_id]) {
          const inputValue = splitInputValues[share.user_id];
          const numericValue = parseFloat(inputValue);
          return (
            sum + (!isNaN(numericValue) ? numericValue : share.share_amount)
          );
        } else {
          // Use original share amounts when no input values
          return sum + share.share_amount;
        }
      }, 0);
      return total.toFixed(2);
    }
    // Fallback to currentAmount if no shares available
    return currentAmount || "0";
  }, [splitInputValues, currentAmount, isExpense, expense]);

  // Handle split expense changes
  const handleSplitApplyChanges = useCallback(async () => {
    if (!isExpense || !expense?.shares || !tgUser?.id || !initData || !chat_id)
      return;

    // Check if there are validation errors
    const hasErrors = Object.keys(splitValidationErrors).length > 0;
    if (hasErrors) return;

    // Create updated shares array
    const updatedShares = expense.shares.map((share: ExpenseShare) => {
      const inputValue = splitInputValues[share.user_id];
      const numericValue = parseFloat(inputValue);
      return {
        ...share,
        share_amount: !isNaN(numericValue) ? numericValue : share.share_amount,
      };
    });

    // Calculate new total from shares
    const newTotalFromShares = updatedShares.reduce(
      (sum: number, share: ExpenseShare) => sum + share.share_amount,
      0
    );

    try {
      // Update expense amount first
      await updateExpenseAmount(
        expense.id,
        newTotalFromShares,
        initData,
        chat_id
      );

      // Then update expense shares
      await updateExpenseShares(
        expense.id,
        updatedShares.map((s: ExpenseShare) => ({
          user_id: s.user_id,
          share_amount: s.share_amount,
        })),
        initData,
        chat_id
      );

      // Update cache after successful API calls
      queryClient.setQueryData(["expense", expense.id], (oldData: Expense | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          amount: newTotalFromShares,
          shares: updatedShares,
        };
      });

      // Update allEntries cache
      queryClient.setQueryData(
        ["allEntries", tgUser.id.toString(), chat_id],
        (oldData: { expenses: Expense[] } | undefined) => {
          if (!oldData || !oldData.expenses) return oldData;

          return {
            ...oldData,
            expenses: oldData.expenses.map((exp: Expense) =>
              exp.id === expense.id
                ? { ...exp, amount: newTotalFromShares }
                : exp
            ),
          };
        }
      );

      // Update current amount in the form using setValue directly
      setValue(FormValues.AMOUNT, newTotalFromShares.toString());
      setSplitHasChanges(false);

      // Reset split input values to match the new amounts
      if (expense?.shares) {
        const updatedInputValues: Record<string | number, string> = {};
        updatedShares.forEach((share: ExpenseShare) => {
          updatedInputValues[share.user_id] = share.share_amount.toString();
        });
        setSplitInputValues(updatedInputValues);
      }
    } catch (error) {
      console.error("Failed to update expense:", error);
    }
  }, [
    isExpense,
    expense,
    tgUser?.id,
    initData,
    chat_id,
    splitValidationErrors,
    splitInputValues,
    queryClient,
    setValue,
  ]);

  return {
    isCustomSplit,
    setIsCustomSplit,
    editExpenseShare,
    setEditExpenseShare,
    splitValidationErrors,
    splitHasChanges,
    setSplitHasChanges,
    splitInputValues,
    setSplitInputValues: handleSplitInputValuesChange,
    setSplitValidationErrors,
    displayAmount,
    handleSplitApplyChanges,
    resetSplitChanges,
    originalIsCustomSplit,
  };
};
