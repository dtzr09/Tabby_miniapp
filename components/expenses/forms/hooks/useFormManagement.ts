import { useCallback, useMemo } from "react";
import {
  UseFormHandleSubmit,
  UseFormReset,
  FieldNamesMarkedBoolean,
} from "react-hook-form";
import { showPopup } from "@telegram-apps/sdk";
import {
  Category,
  Expense,
  Income,
  ExpenseFormData,
  ExpenseShare,
} from "../../../../utils/types";
import { useTelegramWebApp } from "../../../../hooks/useTelegramWebApp";
import { useExpense } from "../../../../hooks/useExpense";
import {
  updateExpenseAmount,
  updateExpenseShares,
} from "../../../../services/expenses";
import { divideAmountEvenly } from "../../../../utils/currencyUtils";

interface UseFormManagementProps {
  entryId?: string;
  expense?: Expense | Income;
  isIncome: boolean;
  categories: Category[];
  chat_id: string;
  selectedCategoryId: number;
  selectedDateTime: Date;
  handleSubmit: UseFormHandleSubmit<ExpenseFormData>;
  reset: UseFormReset<ExpenseFormData>;
  formState?: { dirtyFields: FieldNamesMarkedBoolean<ExpenseFormData> };
}

export const useFormManagement = ({
  entryId,
  expense,
  isIncome,
  categories,
  chat_id,
  selectedCategoryId,
  selectedDateTime,
  handleSubmit,
  reset,
  formState,
}: UseFormManagementProps) => {
  // Get Telegram data and query client
  const { user: tgUser, initData } = useTelegramWebApp();

  const { updateExpenseInCache, deleteExpenseFromCache } = useExpense({
    id: entryId as string,
    isIncome,
    userId: tgUser?.id,
    initData,
    chat_id,
  });

  // Filter categories based on income/expense type
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => cat.is_income === isIncome);
  }, [categories, isIncome]);

  // Get selected category object with type-safe comparison
  const selectedCategory = categories.find(
    (cat) => cat.id == selectedCategoryId // Use == for type coercion
  ) || {
    id: 0,
    name: isIncome ? "Salary" : "Expense",
    emoji: isIncome ? "💰" : "📝",
    is_income: isIncome,
  };

  // Complete onSubmit logic with cache-first strategy
  const onSubmit = useCallback(
    async (data: ExpenseFormData) => {
      try {
        if (!tgUser?.id || !initData || !entryId || !expense) {
          return;
        }

        // Validate entryId is a valid number
        if (entryId === "undefined" || isNaN(Number(entryId))) {
          return;
        }

        let newAmount = parseFloat(data.amount);

        // Check if this is a group expense with shares
        const isGroupExpense =
          !isIncome &&
          "shares" in expense &&
          expense.shares &&
          expense.shares.length > 0;

        // For group expenses, handle share calculations
        let updatedShares: ExpenseShare[] | undefined;
        if (isGroupExpense) {
          const shares = (expense as Expense).shares!;

          // First, determine if this expense is currently in even split mode
          const firstShareAmount = shares[0].share_amount;
          const isCurrentlyEvenSplit = shares.every(
            (share) => Math.abs(share.share_amount - firstShareAmount) < 0.01
          );

          // Check what changed
          const amountFieldChanged =
            formState?.dirtyFields?.amount || newAmount !== expense.amount;
          const sharesChanged = data.shares && data.shares.length > 0;

          if (isCurrentlyEvenSplit && amountFieldChanged) {
            // Even split mode + amount changed: recalculate shares from new amount
            const evenShareAmount = divideAmountEvenly(
              newAmount,
              shares.length
            );
            updatedShares = shares.map((share) => ({
              ...share,
              share_amount: evenShareAmount,
            }));
          } else if (sharesChanged) {
            // Custom split: shares were updated, calculate total from shares
            updatedShares = data.shares;
            const calculatedAmount = data.shares.reduce(
              (sum: number, share: ExpenseShare) => sum + share.share_amount,
              0
            );
            newAmount = calculatedAmount;
          } else if (!isCurrentlyEvenSplit && amountFieldChanged) {
            // Custom split mode but amount was changed - preserve original shares
            updatedShares = shares;
            // Revert to original amount calculated from shares
            newAmount = shares.reduce(
              (sum: number, share: ExpenseShare) => sum + share.share_amount,
              0
            );
          } else {
            // No changes detected, preserve existing shares
            updatedShares = shares;
          }
        }

        // Convert selectedDateTime to UTC with proper validation
        let utcDateTime: string;
        try {
          if (
            selectedDateTime instanceof Date &&
            !isNaN(selectedDateTime.getTime())
          ) {
            utcDateTime = selectedDateTime.toISOString();
          } else if (
            typeof selectedDateTime === "string" &&
            selectedDateTime !== ""
          ) {
            const parsedDate = new Date(selectedDateTime);
            if (!isNaN(parsedDate.getTime())) {
              utcDateTime = parsedDate.toISOString();
            } else {
              utcDateTime = expense.date || new Date().toISOString();
            }
          } else {
            utcDateTime = expense.date || new Date().toISOString();
          }
        } catch {
          utcDateTime = expense.date || new Date().toISOString();
        }

        // CACHE-FIRST STRATEGY: Immediately update cache with optimistic data
        const optimisticExpense = {
          ...expense,
          description: data.description,
          amount: newAmount,
          category: selectedCategory,
          date: utcDateTime,
          isIncome: isIncome,
          ...(isGroupExpense && updatedShares && { shares: updatedShares }),
        };

        // Update cache immediately for instant UI feedback
        updateExpenseInCache(optimisticExpense);

        // Reset form with updated data immediately
        const updatedFormData: ExpenseFormData = {
          description: data.description,
          amount: newAmount.toString(),
          category_id: selectedCategoryId || expense.category?.id || 0,
          date: utcDateTime,
          shares:
            updatedShares ||
            (isGroupExpense ? (expense as Expense).shares || [] : []),
        };

        reset(updatedFormData, { keepDirty: false });

        // Background sync with backend (don't await)
        Promise.all([
          // Main expense update
          fetch(`/api/entries/${entryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              initData: initData,
              ...data,
              category_id: selectedCategoryId || expense.category?.id || 0,
              amount: newAmount,
              isIncome: isIncome,
              date: utcDateTime,
            }),
          }),
          // Amount update if needed
          expense.amount !== newAmount
            ? updateExpenseAmount(
                Number(entryId),
                newAmount,
                initData,
                chat_id,
                isIncome
              )
            : Promise.resolve(),
          // Shares update if needed
          isGroupExpense && updatedShares
            ? updateExpenseShares(
                Number(entryId),
                updatedShares.map((s: ExpenseShare) => ({
                  user_id: s.user_id,
                  share_amount: s.share_amount,
                  ...(s.name && { name: s.name }),
                  ...(s.username && { username: s.username }),
                })),
                initData,
                chat_id
              )
            : Promise.resolve(),
        ])
          .then(async ([mainResponse]) => {
            // Verify main response is ok
            if (mainResponse && !mainResponse.ok) {
              throw new Error("Main update failed");
            }

            // Backend sync successful - cache already has optimistic data
            // Only update if there are significant differences from backend
            if (mainResponse && mainResponse.ok) {
            }

            // Cache is already updated optimistically and with backend data - no refetch needed
          })
          .catch(() => {

            // Revert cache to original data on failure
            updateExpenseInCache({
              ...expense,
              isIncome: isIncome,
            });

            // Reset form to original data
            const originalFormData: ExpenseFormData = {
              description: expense.description || "",
              amount: expense.amount?.toString() || "0",
              category_id: expense.category?.id || 0,
              date: expense.date || "",
              shares: isGroupExpense ? (expense as Expense).shares || [] : [],
            };

            reset(originalFormData, { keepDirty: false });

            showPopup({
              title: "Sync Failed",
              message: "Changes couldn't be saved. Please try again.",
              buttons: [{ type: "ok" }],
            });
          });
      } catch {
        showPopup({
          title: "Error",
          message: "Failed to update expense. Please try again.",
          buttons: [{ type: "ok" }],
        });
      }
    },
    [
      entryId,
      isIncome,
      expense,
      categories,
      selectedDateTime,
      updateExpenseInCache,
      chat_id,
      tgUser,
      initData,
      selectedCategoryId,
      selectedCategory,
      reset,
      formState?.dirtyFields?.amount,
    ]
  );

  const handleFormSubmit = () => {
    handleSubmit(onSubmit)();
  };

  const handleBackspace = (
    currentAmount: string,
    setAmount: (value: string) => void,
    isCustomSplit: boolean
  ) => {
    // Only disable amount editing when actively editing a custom split
    if (isCustomSplit) {
      return;
    }

    let newAmount: string;
    if (currentAmount.length > 1) {
      newAmount = currentAmount.slice(0, -1);
    } else {
      newAmount = "0";
    }

    setAmount(newAmount);
  };

  return {
    // Data
    filteredCategories,
    selectedCategory,

    // Functions
    handleFormSubmit,
    handleBackspace,
    deleteExpenseFromCache,
  };
};
