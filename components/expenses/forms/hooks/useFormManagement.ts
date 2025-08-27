import { useCallback, useMemo } from "react";
import { UseFormHandleSubmit, UseFormReset } from "react-hook-form";
import { showPopup } from "@telegram-apps/sdk";
import {
  Category,
  Expense,
  Income,
  ExpenseFormData,
  ExpenseShare,
  UnifiedEntry,
} from "../../../../utils/types";
import { useTelegramWebApp } from "../../../../hooks/useTelegramWebApp";
import { useExpense } from "../../../../hooks/useExpense";
import { invalidateExpenseCache } from "../../../../utils/cache";
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
          console.error("Missing required data", {
            tgUser: !!tgUser?.id,
            initData: !!initData,
            entryId,
            expense: !!expense,
          });
          return;
        }

        // Immediately reset form's dirty state to show user their changes are being saved
        reset(data, { keepDirty: false });

        // Validate entryId is a valid number
        if (entryId === "undefined" || isNaN(Number(entryId))) {
          console.error("Invalid entryId:", entryId);
          return;
        }

        const newAmount = parseFloat(data.amount);

        // Check if this is a group expense with shares
        const isGroupExpense =
          !isIncome &&
          "shares" in expense &&
          expense.shares &&
          expense.shares.length > 0;

        // For group expenses, calculate evenly split shares
        let updatedShares: ExpenseShare[] | undefined;
        if (isGroupExpense) {
          const shares = (expense as Expense).shares!;
          const shareAmount = divideAmountEvenly(newAmount, shares.length);

          updatedShares = shares.map((share: ExpenseShare) => ({
            ...share, // Preserve all user details (name, username, etc.)
            share_amount: shareAmount,
          }));
        }

        // Create properly typed updated expense - match the expected UnifiedEntry structure
        const updatedExpense: UnifiedEntry = isGroupExpense
          ? {
              ...(expense as Expense),
              description: data.description,
              amount: newAmount,
              category: selectedCategory, // Use Category object per updated UnifiedEntry type
              emoji: selectedCategory.name.charAt(0), // Extract first character (emoji)
              date: data.date,
              shares: updatedShares,
              isIncome: isIncome,
            }
          : {
              ...expense,
              description: data.description,
              amount: newAmount,
              category: selectedCategory, // Use Category object per updated UnifiedEntry type
              emoji: selectedCategory.name.charAt(0), // Extract first character (emoji)
              date: data.date,
              isIncome: isIncome,
            };

        // Convert selectedDateTime to UTC for backend
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

        try {
          console.log("🐛 useFormManagement - Sending data:", {
            ...data,
            category_id: selectedCategoryId || expense.category?.id || 0, // Fallback to original category ID
            amount: newAmount,
            isIncome: isIncome,
            date: utcDateTime,
          });
          // Update expense amount first
          await updateExpenseAmount(
            Number(entryId),
            newAmount,
            initData,
            chat_id,
            isIncome
          );

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

          // Make the API call for other fields in the background
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

          // Invalidate simple cache
          invalidateExpenseCache(tgUser.id.toString(), chat_id);

          updateExpenseInCache(updatedExpense);

          // showPopup({
          //   title: "Success",
          //   message: `${isIncome ? "Income" : "Expense"} updated successfully`,
          //   buttons: [{ type: "ok" }],
          // });
        } catch (err) {
          console.error("Error updating entry:", err);
          showPopup({
            title: "Error",
            message: "Failed to update. Please refresh the page.",
            buttons: [{ type: "ok" }],
          });
        }
      } catch (err) {
        console.error("Error updating entry:", err);
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
      reset,
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
