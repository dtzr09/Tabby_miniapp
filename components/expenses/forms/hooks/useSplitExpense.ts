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
  
  // Flag to prevent useEffect from running during save operations
  const [isSaving, setIsSaving] = useState(false);
  
  // Debug state for UI display
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const addDebugLog = useCallback((message: string) => {
    setDebugLogs(prev => [...prev.slice(-9), message]); // Keep last 10 messages
  }, []);

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

  // Clear splitInputValues when splitHasChanges becomes false (after successful save)
  useEffect(() => {
    if (!splitHasChanges) {
      setSplitInputValues({});
    }
  }, [splitHasChanges]);

  // Sync form state when expense changes (e.g., after successful save)
  useEffect(() => {
    if (expense?.shares && expense?.amount && !isSaving) {
      addDebugLog("🔍 useEffect triggered - Syncing form state with expense data");
      addDebugLog(`🔍 Expense object amount: ${expense.amount}`);
      addDebugLog(`🔍 Expense object shares: ${JSON.stringify(expense.shares)}`);
      
      // Check what's actually in the cache
      const cachedExpense = queryClient.getQueryData(["expense", expense.id]);
      addDebugLog(`🔍 Cached expense data: ${JSON.stringify(cachedExpense)}`);
      
      addDebugLog(`🔍 Setting amount to: ${expense.amount.toString()}`);
      addDebugLog(`🔍 Setting shares to: ${JSON.stringify(expense.shares)}`);
      // Update form state to match the current expense data
      setValue(FormValues.AMOUNT, expense.amount.toString(), { shouldDirty: false });
      setValue(FormValues.SHARES, expense.shares, { shouldDirty: false });
    }
  }, [expense?.shares, expense?.amount, setValue, isSaving, addDebugLog, queryClient, expense?.id]);

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
        const total = shares.reduce((sum, share) => {
          const inputValue = splitInputValues[share.user_id];
          if (inputValue) {
            const numericValue = parseFloat(inputValue);
            return sum + (!isNaN(numericValue) ? numericValue : share.share_amount);
          }
          return sum + share.share_amount;
        }, 0);
        return total.toFixed(2);
      } else {
        // Use actual expense share amounts as the source of truth
        const total = shares.reduce((sum, share) => sum + share.share_amount, 0);
        return total.toFixed(2);
      }
    }
    // Fallback to currentAmount if no shares available
    return currentAmount || "0";
  }, [splitInputValues, splitHasChanges, currentAmount, isExpense, expense]);

  // Debug info for UI
  const debugInfo = useMemo(() => {
    if (!isExpense || !expense?.shares) return "";
    
    const hasInputChanges = Object.keys(splitInputValues).length > 0;
    const shouldUseInputValues = hasInputChanges && splitHasChanges;
    const shareAmounts = expense.shares.map(s => s.share_amount).join(',');
    
    return `Debug: ${shouldUseInputValues ? 'Using inputs' : 'Using expense data'} | HasChanges: ${splitHasChanges} | InputVals: ${JSON.stringify(splitInputValues)} | ExpenseAmt: ${expense.amount} | ShareAmts: ${shareAmounts} | CurrentAmt: ${currentAmount} | DisplayAmt: ${displayAmount}`;
  }, [splitInputValues, splitHasChanges, isExpense, expense, currentAmount, displayAmount]);

  // Handle split expense changes
  const handleSplitApplyChanges = useCallback(async () => {
    if (!isExpense || !expense?.shares || !tgUser?.id || !initData || !chat_id)
      return;

    // Check if there are validation errors
    const hasErrors = Object.keys(splitValidationErrors).length > 0;
    if (hasErrors) return;
    
    // Set saving flag to prevent useEffect from interfering
    setIsSaving(true);
    addDebugLog("🔍 Starting save operation - isSaving set to true");

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
          share_amount: !isNaN(numericValue) ? numericValue : share.share_amount,
        };
      });
      newTotalFromShares = updatedShares.reduce(
        (sum: number, share: ExpenseShare) => sum + share.share_amount,
        0
      );
    } else {
      // For even split, calculate evenly distributed amounts
      const totalAmount = parseFloat(currentAmount) || expense.amount;
      const evenShareAmount = totalAmount / expense.shares.length;
      
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
      addDebugLog("🔍 Updating expense cache with new values");
      addDebugLog(`🔍 Cache key: ["expense", ${expense.id}]`);
      addDebugLog(`🔍 New total amount: ${newTotalFromShares}`);
      addDebugLog(`🔍 New shares: ${JSON.stringify(updatedShares)}`);
      
      queryClient.setQueryData(
        ["expense", expense.id],
        (oldData: Expense | undefined) => {
          if (!oldData) {
            addDebugLog("🔍 No old data found in expense cache");
            return oldData;
          }
          addDebugLog(`🔍 Old expense shares: ${JSON.stringify(oldData.shares)}`);
          addDebugLog(`🔍 Old expense amount: ${oldData.amount}`);
          
          const newData = {
            ...oldData,
            amount: newTotalFromShares,
            shares: updatedShares,
          };
          
          addDebugLog(`🔍 New expense data: ${JSON.stringify(newData)}`);
          return newData;
        }
      );

      // Update allEntries cache
      addDebugLog("🔍 Updating allEntries cache with new values");
      addDebugLog(`🔍 Cache key: ["allEntries", ${tgUser.id.toString()}, ${chat_id}]`);
      
      queryClient.setQueryData(
        ["allEntries", tgUser.id.toString(), chat_id],
        (oldData: { expenses: Expense[] } | undefined) => {
          if (!oldData || !oldData.expenses) {
            addDebugLog("🔍 No old data found in allEntries cache");
            return oldData;
          }

          addDebugLog(`🔍 Found ${oldData.expenses.length} expenses in allEntries cache`);
          
          const updatedExpenses = oldData.expenses.map((exp: Expense) => {
            if (exp.id === expense.id) {
              addDebugLog(`🔍 Updating expense ${exp.id} in allEntries cache`);
              addDebugLog(`🔍 Old: amount=${exp.amount}, shares=${JSON.stringify(exp.shares)}`);
              addDebugLog(`🔍 New: amount=${newTotalFromShares}, shares=${JSON.stringify(updatedShares)}`);
              return { ...exp, amount: newTotalFromShares, shares: updatedShares };
            }
            return exp;
          });

          return {
            ...oldData,
            expenses: updatedExpenses,
          };
        }
      );
      
      // Force the useExpense hook to re-render with updated cache data
      if (refreshCache) {
        addDebugLog("🔍 Calling refreshCache to force useExpense re-render");
        addDebugLog("🔍 Before refreshCache - expense object still has old values");
        addDebugLog(`🔍 Current expense.amount: ${expense.amount}`);
        addDebugLog(`🔍 Current expense.shares: ${JSON.stringify(expense.shares)}`);
        refreshCache();
        addDebugLog("🔍 After refreshCache called");
      } else {
        addDebugLog("🔍 refreshCache function not available");
      }

      // Update current amount in the form and mark as not dirty since we just saved
      addDebugLog(`🔍 Before setValue - Setting amount to: ${newTotalFromShares.toString()}`);
      addDebugLog(`🔍 Current expense amount: ${expense.amount}`);
      setValue(FormValues.AMOUNT, newTotalFromShares.toString(), { shouldDirty: false });
      setSplitHasChanges(false);

      // Reset split input values to match the new amounts
      if (expense?.shares) {
        const updatedInputValues: Record<string | number, string> = {};
        updatedShares.forEach((share: ExpenseShare) => {
          updatedInputValues[share.user_id] = share.share_amount.toString();
        });
        setSplitInputValues(updatedInputValues);
        
        // Also update the form shares field to match the new amounts
        addDebugLog(`🔍 Before setValue - Setting shares to: ${JSON.stringify(updatedShares)}`);
        addDebugLog(`🔍 Current expense shares: ${JSON.stringify(expense.shares)}`);
        setValue(FormValues.SHARES, updatedShares, { shouldDirty: false });
        
        // Note: Don't call reset() here as it can cause issues with other form fields like date
        // Instead, just use setValue to update the specific fields we need
      }
      
      addDebugLog("🔍 After save - Split changes set to false, form values updated");
      
      // Reset saving flag
      setIsSaving(false);
      addDebugLog("🔍 Save operation complete - isSaving set to false");
      
      return true;
    } catch (error) {
      console.error("Failed to update expense:", error);
      
      // Reset saving flag on error too
      setIsSaving(false);
      addDebugLog("🔍 Save operation failed - isSaving set to false");
      
      return false;
    }
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
    setIsSaving,
    refreshCache,
  ]);

  // Handle split mode toggle
  const handleSplitModeToggle = useCallback(() => {
    const newIsCustomSplit = !isCustomSplit;
    setIsCustomSplit(newIsCustomSplit);
    
    // If toggling from custom split to even split, calculate even amounts
    if (isCustomSplit && !newIsCustomSplit && expense?.shares) {
      // Use the current amount from the form, or fall back to expense amount
      const totalAmount = parseFloat(currentAmount) || (expense?.amount || 0);
      const shares = expense.shares;
      const evenShareAmount = totalAmount / shares.length;
      
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
  }, [isCustomSplit, expense?.shares, currentAmount, expense?.amount, handleSplitInputValuesChange, setSplitHasChanges, setValue]);

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
    debugInfo,
    debugLogs,
    isSaving,
  };
};
