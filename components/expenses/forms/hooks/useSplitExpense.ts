import { useState, useCallback, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Expense,
  ExpenseFormData,
  ExpenseShare,
  UnifiedEntry,
} from "../../../../utils/types";
import {
  updateExpenseAmount,
  updateExpenseShares,
} from "../../../../services/expenses";
import {
  sumCurrencyValues,
  divideAmountEvenly,
} from "../../../../utils/currencyUtils";
import { UseFormReset, UseFormSetValue } from "react-hook-form";
import { useTelegramWebApp } from "../../../../hooks/useTelegramWebApp";
import { FormValues } from "../EntryForm";

interface UseSplitExpenseProps {
  expense?: Expense;
  isExpense: boolean;
  chat_id?: string;
  currentAmount: string;
  setValue: UseFormSetValue<ExpenseFormData>;
  refreshCache?: () => void;
  updateExpenseInCache?: (updatedExpense: UnifiedEntry) => void;
  reset: UseFormReset<ExpenseFormData>;
}

export const useSplitExpense = ({
  expense,
  isExpense,
  chat_id,
  currentAmount,
  setValue,
  refreshCache,
  updateExpenseInCache,
  reset,
}: UseSplitExpenseProps) => {
  const queryClient = useQueryClient();
  const { user: tgUser, initData } = useTelegramWebApp();
  const [savedExpense, setSavedExpense] = useState(false);

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
  }, [
    isExpense,
    expense?.shares?.length,
    expense?.shares?.map((s) => s.share_amount).join(","), // Only re-calculate when share amounts actually change
  ]);

  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [splitModeOverride, setSplitModeOverride] = useState<boolean | null>(
    null
  );

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

  // Update splitInputValues when currentAmount changes and we're in even split mode
  useEffect(() => {
    if (
      !isCustomSplit &&
      expense?.shares &&
      currentAmount &&
      parseFloat(currentAmount) > 0
    ) {
      const totalAmount = parseFloat(currentAmount);
      const evenShareAmount = divideAmountEvenly(
        totalAmount,
        expense.shares.length
      );

      // Create new input values with even split amounts
      const newInputValues: Record<string | number, string> = {};
      expense.shares.forEach((share: ExpenseShare) => {
        newInputValues[share.user_id] = evenShareAmount.toFixed(2);
      });

      // Only update if values actually changed to avoid infinite loops
      const currentValues = JSON.stringify(splitInputValues);
      const newValues = JSON.stringify(newInputValues);
      if (currentValues !== newValues) {
        setSplitInputValues(newInputValues);
      }
    }
  }, [currentAmount, isCustomSplit, expense?.shares, splitInputValues]);

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
        setValue(FormValues.AMOUNT, formattedAmount, {
          shouldDirty: true,
          shouldValidate: true,
          shouldTouch: true,
        });
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

  // Calculate display amount - prioritize splitInputValues when actively editing, otherwise use expense shares
  const displayAmount = useMemo(() => {
    if (isExpense && expense?.shares) {
      const shares = expense.shares;

      // Always use splitInputValues if they exist and we're in custom split mode or have changes
      const hasInputChanges = Object.keys(splitInputValues).length > 0;
      const shouldUseInputValues =
        hasInputChanges && (splitHasChanges || isCustomSplit);

      if (shouldUseInputValues) {
        // Calculate from input values when user is actively editing or in custom split mode
        const amounts = shares.map((share) => {
          const inputValue = splitInputValues[share.user_id];
          if (inputValue !== undefined && inputValue !== "") {
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
  }, [
    splitInputValues,
    splitHasChanges,
    currentAmount,
    isExpense,
    expense,
    isCustomSplit,
  ]);

  // Handle split expense changes with cache-first strategy
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

    // CACHE-FIRST STRATEGY: Immediately update cache with optimistic data
    const updatedExpense: UnifiedEntry = {
      ...expense,
      amount: newTotalFromShares,
      shares: updatedShares,
      isIncome: false, // Split expenses are always expenses, not income
    };

    // Update cache immediately for instant UI feedback
    if (updateExpenseInCache) {
      updateExpenseInCache(updatedExpense);
    } else {
      queryClient.setQueryData(["expense", expense.id], updatedExpense);
    }

    // Update form immediately with proper date handling
    const updatedFormData: ExpenseFormData = {
      description: expense.description,
      amount: newTotalFromShares.toString(),
      category_id: expense.category?.id || 0,
      date: expense.date || new Date().toISOString(),
      shares: updatedShares || [],
    };
    reset(updatedFormData, { keepDirty: false });

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
    setSavedExpense(true);

    // Background sync with backend (don't await)
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
      ),
    ])
      .then(() => {
        // Sync successful - cache is already updated with optimistic data
        console.log("Split expense sync successful");
      })
      .catch((error) => {
        console.error("Failed to sync split expense with backend:", error);

        // Revert cache to original data on failure
        const originalExpense: UnifiedEntry = {
          ...expense,
          amount: expense.amount,
          shares: expense.shares,
          isIncome: false,
        };

        if (updateExpenseInCache) {
          updateExpenseInCache(originalExpense);
        } else {
          queryClient.setQueryData(["expense", expense.id], originalExpense);
        }

        // Revert form data with proper date handling
        const originalFormData: ExpenseFormData = {
          description: expense.description,
          amount: expense.amount.toString(),
          category_id: expense.category?.id || 0,
          date: expense.date || new Date().toISOString(),
          shares: expense.shares || [],
        };
        reset(originalFormData, { keepDirty: false });

        // Revert UI state
        setValue(FormValues.AMOUNT, expense.amount.toString(), {
          shouldDirty: false,
        });
        setValue(FormValues.SHARES, expense.shares || [], {
          shouldDirty: false,
        });

        // Revert split input values
        const originalInputValues: Record<string | number, string> = {};
        expense.shares?.forEach((share: ExpenseShare) => {
          originalInputValues[share.user_id] = share.share_amount.toString();
        });
        setSplitInputValues(originalInputValues);

        setSplitHasChanges(true);
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
    savedExpense,
  ]);

  // Handle split mode toggle
  const handleSplitModeToggle = useCallback(() => {
    const newIsCustomSplit = !isCustomSplit;
    setIsCustomSplit(newIsCustomSplit);
    setSplitModeOverride(newIsCustomSplit);

    if (expense?.shares) {
      // If toggling from custom split to even split, calculate even amounts
      if (isCustomSplit && !newIsCustomSplit) {
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
      // If toggling from even split to custom split, set up for custom editing
      else if (!isCustomSplit && newIsCustomSplit) {
        // Initialize split input values with current share amounts
        const currentInputValues: Record<string | number, string> = {};
        expense.shares.forEach((share: ExpenseShare) => {
          currentInputValues[share.user_id] = share.share_amount.toString();
        });

        // Set up split input values and mark as having changes
        setSplitInputValues(currentInputValues);
        setValue(FormValues.SHARES, expense.shares, { shouldDirty: true });
        setSplitHasChanges(true);
      }
    }
  }, [
    isCustomSplit,
    expense?.shares,
    currentAmount,
    expense?.amount,
    handleSplitInputValuesChange,
    setSplitInputValues,
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
