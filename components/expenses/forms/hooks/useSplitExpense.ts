import { useState, useCallback, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Expense,
  ExpenseFormData,
  ExpenseShare,
} from "../../../../utils/types";
import {
  updateExpenseAmount,
  updateExpenseShares,
} from "../../../../services/expenses";
import {
  sumCurrencyValues,
  divideAmountEvenly,
} from "../../../../utils/currencyUtils";
import { UseFormSetValue } from "react-hook-form";
import { useTelegramWebApp } from "../../../../hooks/useTelegramWebApp";
import { FormValues } from "../EntryForm";

interface UseSplitExpenseProps {
  expense?: Expense;
  isExpense: boolean;
  chat_id?: string;
  currentAmount: string;
  setValue: UseFormSetValue<ExpenseFormData>;
  refreshCache?: () => void;
}

export const useSplitExpense = ({
  expense,
  isExpense,
  chat_id,
  currentAmount,
  setValue,
  refreshCache,
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
  const [splitModeOverride, setSplitModeOverride] = useState<boolean | null>(null);

  // Update isCustomSplit when originalIsCustomSplit changes, but respect user override
  useEffect(() => {
    if (splitModeOverride !== null) {
      setIsCustomSplit(splitModeOverride);
    } else {
      setIsCustomSplit(originalIsCustomSplit);
    }
  }, [originalIsCustomSplit, splitModeOverride]);

  const [editExpenseShare, setEditExpenseShare] = useState(false);

  // Split expense state
  const [splitValidationErrors, setSplitValidationErrors] = useState<
    Record<string | number, string>
  >({});
  const [splitHasChanges, setSplitHasChanges] = useState(false);
  const [splitInputValues, setSplitInputValues] = useState<
    Record<string | number, string>
  >({});

  // Clear splitInputValues when splitHasChanges becomes false (after successful save)
  useEffect(() => {
    if (!splitHasChanges) {
      setSplitInputValues({});
    }
  }, [splitHasChanges]);

  // Sync form state when expense changes (e.g., after successful save)
  useEffect(() => {
    if (expense?.shares && expense?.amount) {
      // Update form state to match the current expense data
      setValue(FormValues.AMOUNT, expense.amount.toString(), {
        shouldDirty: false,
      });
      setValue(FormValues.SHARES, expense.shares, { shouldDirty: false });
    }
  }, [expense?.shares, expense?.amount, setValue]);

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

        // Calculate new total amount with proper currency precision
        const shareAmounts = updatedShares.map(
          (share: ExpenseShare) => share.share_amount
        );
        const newTotal = sumCurrencyValues(shareAmounts);

        // Format the amount consistently with the original defaultValues format
        const formattedAmount = newTotal.toString();

        // Use setValue with shouldDirty to mark form as dirty when split amounts change
        setValue(FormValues.AMOUNT, formattedAmount, { shouldDirty: true });
      }
    },
    [expense?.shares, expense?.amount, setValue]
  );

  // Reset split changes back to original values
  const resetSplitChanges = useCallback(() => {
    // Reset split input values
    setSplitInputValues({});

    // Reset form fields back to original values
    if (expense?.amount) {
      const originalAmount = expense.amount.toString();
      setValue(FormValues.AMOUNT, originalAmount);
    }

    // Reset shares back to original values
    if (expense?.shares) {
      setValue(FormValues.SHARES, expense.shares);
    }

    // Reset split state
    setSplitHasChanges(false);
    setEditExpenseShare(false);

    // Reset custom split back to original state
    setSplitModeOverride(null); // Clear override to go back to original calculation
    setIsCustomSplit(originalIsCustomSplit);
  }, [expense?.amount, expense?.shares, setValue, originalIsCustomSplit]);

  // Calculate display amount - prioritize actual expense data over temporary input values
  const displayAmount = useMemo(() => {
    if (isExpense && expense?.shares) {
      const shares = expense.shares;

      // Only use splitInputValues if we have changes and are actively editing
      const hasInputChanges = Object.keys(splitInputValues).length > 0;
      const shouldUseInputValues = hasInputChanges && splitHasChanges;

      if (shouldUseInputValues) {
        // Calculate from input values when user is actively editing
        const amounts = shares.map((share) => {
          const inputValue = splitInputValues[share.user_id];
          if (inputValue) {
            const numericValue = parseFloat(inputValue);
            return !isNaN(numericValue) ? numericValue : share.share_amount;
          }
          return share.share_amount;
        });
        const total = sumCurrencyValues(amounts);
        return total.toFixed(2);
      } else {
        // Use actual expense share amounts as the source of truth
        const shareAmounts = shares.map((share) => share.share_amount);
        const total = sumCurrencyValues(shareAmounts);
        return total.toFixed(2);
      }
    }
    // Fallback to currentAmount if no shares available
    return currentAmount || "0";
  }, [splitInputValues, splitHasChanges, currentAmount, isExpense, expense]);

  // Handle split expense changes
  const handleSplitApplyChanges = useCallback(async () => {
    if (!isExpense || !expense?.shares || !tgUser?.id || !initData || !chat_id)
      return;

    // Check if there are validation errors
    const hasErrors = Object.keys(splitValidationErrors).length > 0;
    if (hasErrors) return;

    // Create updated shares array based on split mode
    let updatedShares: ExpenseShare[];
    let newTotalFromShares: number;

    if (isCustomSplit) {
      // For custom split, use the input values
      updatedShares = expense.shares.map((share: ExpenseShare) => {
        const inputValue = splitInputValues[share.user_id];
        const numericValue = parseFloat(inputValue);
        return {
          ...share,
          share_amount: !isNaN(numericValue)
            ? numericValue
            : share.share_amount,
        };
      });
      newTotalFromShares = updatedShares.reduce(
        (sum: number, share: ExpenseShare) => sum + share.share_amount,
        0
      );
    } else {
      // For even split, calculate evenly distributed amounts
      const totalAmount = parseFloat(currentAmount) || expense.amount;
      const evenShareAmount = divideAmountEvenly(
        totalAmount,
        expense.shares.length
      );

      updatedShares = expense.shares.map((share: ExpenseShare) => ({
        ...share,
        share_amount: evenShareAmount,
      }));
      newTotalFromShares = totalAmount;

      // Update split input values to reflect even split amounts
      const evenSplitInputValues: Record<string | number, string> = {};
      expense.shares.forEach((share: ExpenseShare) => {
        evenSplitInputValues[share.user_id] = evenShareAmount.toFixed(2);
      });
      setSplitInputValues(evenSplitInputValues);
    }

    // Immediately update cache for instant UI feedback
    queryClient.setQueryData(
      ["expense", expense.id],
      (oldData: Expense | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          amount: newTotalFromShares,
          shares: updatedShares,
        };
      }
    );

    // Update allEntries cache immediately
    queryClient.setQueryData(
      ["allEntries", tgUser.id.toString(), chat_id],
      (oldData: { expenses: Expense[] } | undefined) => {
        if (!oldData || !oldData.expenses) return oldData;

        return {
          ...oldData,
          expenses: oldData.expenses.map((exp: Expense) =>
            exp.id === expense.id
              ? { ...exp, amount: newTotalFromShares, shares: updatedShares }
              : exp
          ),
        };
      }
    );

    // Immediately update UI state
    setValue(FormValues.AMOUNT, newTotalFromShares.toString(), {
      shouldDirty: false,
    });
    setValue(FormValues.SHARES, updatedShares, { shouldDirty: false });
    setSplitHasChanges(false);
    
    // Update split input values to match the new amounts
    const updatedInputValues: Record<string | number, string> = {};
    updatedShares.forEach((share: ExpenseShare) => {
      updatedInputValues[share.user_id] = share.share_amount.toString();
    });
    setSplitInputValues(updatedInputValues);

    // Preserve the current split mode by setting override
    setSplitModeOverride(isCustomSplit);

    // Force the useExpense hook to re-render with updated cache data
    if (refreshCache) {
      refreshCache();
    }

    // Handle API calls in background (don't await)
    Promise.all([
      updateExpenseAmount(
        expense.id,
        newTotalFromShares,
        initData,
        chat_id,
        false
      ),
      updateExpenseShares(
        expense.id,
        updatedShares.map((s: ExpenseShare) => ({
          user_id: s.user_id,
          share_amount: s.share_amount,
        })),
        initData,
        chat_id
      )
    ]).catch((error) => {
      console.error("Failed to update expense in background:", error);
      
      // Revert cache and UI state on failure
      queryClient.setQueryData(
        ["expense", expense.id],
        (oldData: Expense | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            amount: expense.amount,
            shares: expense.shares,
          };
        }
      );

      queryClient.setQueryData(
        ["allEntries", tgUser.id.toString(), chat_id],
        (oldData: { expenses: Expense[] } | undefined) => {
          if (!oldData || !oldData.expenses) return oldData;

          return {
            ...oldData,
            expenses: oldData.expenses.map((exp: Expense) =>
              exp.id === expense.id
                ? { ...exp, amount: expense.amount, shares: expense.shares }
                : exp
            ),
          };
        }
      );

      // Revert UI state
      setValue(FormValues.AMOUNT, expense.amount?.toString() || "0", {
        shouldDirty: true,
      });
      setValue(FormValues.SHARES, expense.shares || [], { shouldDirty: true });
      setSplitHasChanges(true);

      if (refreshCache) {
        refreshCache();
      }
    });

    return true;
  }, [
    isExpense,
    expense,
    tgUser?.id,
    initData,
    chat_id,
    splitValidationErrors,
    splitInputValues,
    currentAmount,
    isCustomSplit,
    queryClient,
    setValue,
    refreshCache,
  ]);

  // Handle split mode toggle
  const handleSplitModeToggle = useCallback(() => {
    const newIsCustomSplit = !isCustomSplit;
    setIsCustomSplit(newIsCustomSplit);
    setSplitModeOverride(newIsCustomSplit);

    // If toggling from custom split to even split, calculate even amounts
    if (isCustomSplit && !newIsCustomSplit && expense?.shares) {
      // Use the current amount from the form, or fall back to expense amount
      const totalAmount = parseFloat(currentAmount) || expense?.amount || 0;
      const shares = expense.shares;
      const evenShareAmount = divideAmountEvenly(totalAmount, shares.length);

      // Create new input values with even split amounts
      const newInputValues: Record<string | number, string> = {};
      shares.forEach((share: ExpenseShare) => {
        newInputValues[share.user_id] = evenShareAmount.toFixed(2);
      });

      // Create updated shares for the form
      const updatedShares = shares.map((share: ExpenseShare) => ({
        ...share,
        share_amount: evenShareAmount,
      }));

      // Update both the split input values and the form shares field
      handleSplitInputValuesChange(newInputValues);
      setValue(FormValues.SHARES, updatedShares, { shouldDirty: true });
      setSplitHasChanges(true);
    }
  }, [
    isCustomSplit,
    expense?.shares,
    currentAmount,
    expense?.amount,
    handleSplitInputValuesChange,
    setSplitHasChanges,
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
    handleSplitModeToggle,
  };
};
