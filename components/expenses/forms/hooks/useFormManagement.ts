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
import { broadcastExpenseUpdate } from "../../../../utils/expenseUpdateBroadcaster";

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

  // Get expense management functions
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

  // Complete onSubmit logic moved from index.tsx
  const onSubmit = useCallback(
    async (data: ExpenseFormData) => {
      try {
        if (!tgUser?.id || !initData || !entryId || !expense) {
          return;
        }

        // Immediately reset form's dirty state to show user their changes are being saved
        reset(data, { keepDirty: false });

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

        // Convert selectedDateTime to UTC for backend first
        if (
          !(selectedDateTime instanceof Date) ||
          isNaN(selectedDateTime.getTime())
        ) {
          console.warn(
            "Invalid selectedDateTime:",
            selectedDateTime,
            "using current date instead"
          );
        }
        const utcDateTime =
          selectedDateTime instanceof Date && !isNaN(selectedDateTime.getTime())
            ? selectedDateTime.toISOString()
            : new Date().toISOString();

        // Create properly typed updated expense - match the expected UnifiedEntry structure
        // const updatedExpense: UnifiedEntry = isGroupExpense
        //   ? {
        //       ...(expense as Expense),
        //       description: data.description,
        //       amount: newAmount,
        //       category: selectedCategory, // Use Category object per updated UnifiedEntry type
        //       emoji: selectedCategory.name.charAt(0), // Extract first character (emoji)
        //       date: utcDateTime, // Use converted UTC date
        //       shares: updatedShares,
        //       isIncome: isIncome,
        //     }
        //   : {
        //       ...expense,
        //       description: data.description,
        //       amount: newAmount,
        //       category: selectedCategory, // Use Category object per updated UnifiedEntry type
        //       emoji: selectedCategory.name.charAt(0), // Extract first character (emoji)
        //       date: utcDateTime, // Use converted UTC date
        //       isIncome: isIncome,
        //     };

        try {
          // Make the API call for all fields including amount
          const response = await fetch(`/api/entries/${entryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chat_id,
              initData: initData,
              ...data,
              category_id: selectedCategoryId || expense.category?.id || 0, // Fallback to original category ID
              amount: newAmount,
              isIncome: isIncome,
              date: utcDateTime,
            }),
          });

          if (!response.ok) {
            // If update fails, show error but don't block navigation
            showPopup({
              title: "Error",
              message: "Failed to update. Please refresh the page.",
              buttons: [{ type: "ok" }],
            });
            return;
          }

          // Update expense amount with separate API call if needed
          if (expense.amount !== newAmount) {
            await updateExpenseAmount(
              Number(entryId),
              newAmount,
              initData,
              chat_id,
              isIncome
            );
          }

          // If it's a group expense, also update the shares
          if (isGroupExpense && updatedShares) {
            await updateExpenseShares(
              Number(entryId),
              updatedShares.map((s: ExpenseShare) => ({
                user_id: s.user_id,
                share_amount: s.share_amount,
                // Preserve other user details if they exist
                ...(s.name && { name: s.name }),
                ...(s.username && { username: s.username }),
              })),
              initData,
              chat_id
            );
          }

          // Use the expense update broadcaster for proper cache invalidation
          console.log("🔄 Broadcasting expense update");
          broadcastExpenseUpdate(tgUser.id.toString(), chat_id, entryId);
          console.log("✅ Expense update broadcasted successfully");

          // showPopup({
          //   title: "Success",
          //   message: `${isIncome ? "Income" : "Expense"} updated successfully`,
          //   buttons: [{ type: "ok" }],
          // });
        } catch {
          showPopup({
            title: "Error",
            message: "Failed to update. Please refresh the page.",
            buttons: [{ type: "ok" }],
          });
        }
      } catch {
        showPopup({
          title: "Error",
          message: "Failed to update. Please refresh the page.",
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
