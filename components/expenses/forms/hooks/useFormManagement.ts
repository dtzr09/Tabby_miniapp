import { useCallback, useMemo } from "react";
import { UseFormHandleSubmit } from "react-hook-form";
import { showPopup } from "@telegram-apps/sdk";
import {
  Category,
  Expense,
  Income,
  ExpenseFormData,
} from "../../../../utils/types";
import { useTelegramWebApp } from "../../../../hooks/useTelegramWebApp";
import { useExpense } from "../../../../hooks/useExpense";
import { invalidateExpenseCache } from "../../../../utils/cache";

interface UseFormManagementProps {
  entryId?: string;
  expense?: Expense | Income;
  isIncome: boolean;
  categories: Category[];
  chat_id?: string;
  selectedCategoryId: number;
  selectedDateTime: Date;
  handleSubmit: UseFormHandleSubmit<ExpenseFormData>;
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
}: UseFormManagementProps) => {
  // Get Telegram data
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
          console.error("Missing required data");
          return;
        }

        const updatedExpense = {
          ...expense,
          description: data.description,
          amount: parseFloat(data.amount),
          category: selectedCategory.name,
          date: data.date, // Use the form's date format directly
          isIncome: isIncome,
        };

        // Optimistically update the cache
        updateExpenseInCache(updatedExpense);

        // Convert selectedDateTime to UTC for backend
        const utcDateTime = selectedDateTime.toISOString();

        // Make the API call in the background
        const response = await fetch(`/api/entries/${entryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tgUser.id.toString(),
            initData: initData,
            ...data,
            category_id: selectedCategoryId, // Use the current selected category ID
            amount: parseFloat(data.amount),
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

        // Invalidate expense cache after successful update
        invalidateExpenseCache(tgUser.id.toString(), chat_id as string);
        console.log("🗑️ Cache invalidated after expense update");

        showPopup({
          title: "Success",
          message: `${isIncome ? "Income" : "Expense"} updated successfully`,
          buttons: [{ type: "ok" }],
        });
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
