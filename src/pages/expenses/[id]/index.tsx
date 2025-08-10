import { backButton, init, showPopup } from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Alert } from "@mui/material";
import { TelegramWebApp } from "../../../../utils/types";
import { useForm } from "react-hook-form";
import DeleteExpenseDialog from "../../../../components/expenses/utils/DeleteExpenseDialog";
import { useQueryClient } from "@tanstack/react-query";
import { refetchExpensesQueries } from "../../../../utils/refetchExpensesQueries";
import { TelegramUser } from "../../../../components/dashboard";
import EntryForm from "../../../../components/expenses/forms/EntryForm";
import LoadingSkeleton from "../../../../components/dashboard/LoadingSkeleton";
import { useExpense } from "../../../../hooks/useExpense";
import { useAllEntries } from "../../../../hooks/useAllEntries";
import { useTheme } from "@/contexts/ThemeContext";

interface ExpenseFormData {
  description: string;
  amount: string;
  category_id: number;
}

const ExpenseDetail = () => {
  const router = useRouter();
  const { id: entryId, isIncome } = router.query;
  const { colors } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  // Get categories from useAllEntries
  const { categories, isError: isCategoriesError } = useAllEntries(
    tgUser?.id,
    initData
  );

  // Get expense data with cache-first strategy
  const {
    data: expense,
    isLoading,
    isError: isExpenseError,
    error: expenseError,
  } = useExpense({
    id: entryId as string,
    isIncome: isIncome === "true",
    userId: tgUser?.id,
    initData,
  });

  const defaultValues: ExpenseFormData = {
    description: "",
    amount: "",
    category_id: 0,
  };

  const {
    control,
    handleSubmit,
    formState: { isDirty, isSubmitting },
    reset,
  } = useForm<ExpenseFormData>({
    defaultValues,
    mode: "onChange",
  });

  // Reset form when expense data changes
  useEffect(() => {
    if (expense) {
      reset(
        {
          description: expense.description || "",
          amount: Math.abs(expense.amount).toString(),
          category_id: expense.category?.id || 0,
        },
        { keepDirty: false }
      );
    }
  }, [expense, reset]);

  // Initialize Telegram WebApp
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeApp = async () => {
      try {
        init(); // Initialize Telegram WebApp
        backButton.mount(); // Mount back button
        backButton.show(); // Show back button
        backButton.onClick(() => router.back()); // Set back button click handler

        const webApp = window.Telegram?.WebApp as TelegramWebApp;
        if (!webApp?.initData) {
          console.log("⏳ Waiting for Telegram WebApp to initialize...");
          setTimeout(initializeApp, 100);
          return;
        }

        const user = webApp.initDataUnsafe?.user;
        const webAppInitData = webApp.initData;

        if (!user?.id || !webAppInitData || !entryId) {
          console.error("Missing required data");
          return;
        }

        setTgUser(user as TelegramUser);
        setInitData(webAppInitData);
      } catch (err) {
        console.error("Error initializing expense detail:", err);
      }
    };

    initializeApp();
  }, [entryId]);

  const onSubmit = useCallback(
    async (data: ExpenseFormData) => {
      try {
        const webApp = window.Telegram?.WebApp as TelegramWebApp;
        const user = webApp.initDataUnsafe?.user;
        const webAppInitData = webApp.initData;

        if (!user?.id || !webAppInitData || !entryId || !expense) {
          console.error("Missing Telegram user/init data or expense ID");
          return;
        }

        const userId = user.id.toString();
        const queryKeys = [
          ["expensesWithBudget", userId],
          ["allEntries", userId],
        ];

        // Create the updated expense object
        const updatedExpense = {
          ...expense,
          description: data.description,
          amount: parseFloat(data.amount) * (isIncome === "true" ? 1 : -1),
          category: categories.find((c) => c.id === data.category_id),
        };

        // Optimistically update the cache
        queryKeys.forEach((queryKey) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryClient.setQueryData(queryKey, (oldData: any) => {
            if (!oldData) return oldData;

            // Handle array response
            if (Array.isArray(oldData)) {
              return oldData.map((item) =>
                item.id === updatedExpense.id ? updatedExpense : item
              );
            }

            // Handle allEntries structure
            if (oldData.expenses || oldData.income) {
              const isIncomeEntry = isIncome === "true";
              return {
                ...oldData,
                expenses: isIncomeEntry
                  ? oldData.expenses
                  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    oldData.expenses.map((e: any) =>
                      e.id === updatedExpense.id ? updatedExpense : e
                    ),
                income: isIncomeEntry
                  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    oldData.income.map((i: any) =>
                      i.id === updatedExpense.id ? updatedExpense : i
                    )
                  : oldData.income,
              };
            }

            return oldData;
          });
        });

        // Make the API call
        const response = await fetch(`/api/entries/${entryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: userId,
            initData: webAppInitData,
            ...data,
            amount: parseFloat(data.amount),
            isIncome: isIncome === "true",
          }),
        });

        if (!response.ok) {
          // If the update fails, revert the optimistic update
          queryKeys.forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });

          const errorText = await response.text();
          console.error("Failed to update entry:", errorText);
          showPopup({
            title: "Error",
            message: "Failed to update. Please try again.",
            buttons: [{ type: "ok" }],
          });
          return;
        }

        // Background refetch to ensure consistency
        refetchExpensesQueries(queryClient, userId);

        showPopup({
          title: "Success",
          message: `${
            isIncome === "true" ? "Income" : "Expense"
          } updated successfully`,
          buttons: [{ type: "ok" }],
        });

        reset(data, { keepDirty: false });
      } catch (err) {
        console.error("Error updating entry:", err);
        showPopup({
          title: "Error",
          message: "An error occurred. Please try again.",
          buttons: [{ type: "ok" }],
        });
      }
    },
    [reset, entryId, isIncome, expense, categories, queryClient]
  );

  // Handle loading and error states
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isExpenseError || isCategoriesError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {expenseError instanceof Error
            ? expenseError.message
            : "Failed to load expense data. Please try again."}
        </Alert>
        <Button
          variant="contained"
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!expense) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">
          Expense not found. It may have been deleted.
        </Alert>
        <Button
          variant="contained"
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        background: colors.background,
        px: 2,
        display: "flex",
        flexDirection: "column",
        pt: "16px",
      }}
    >
      <EntryForm
        control={control}
        categories={categories}
        isIncome={isIncome === "true"}
        isLoading={isLoading}
        date={expense.date}
      />

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "row",
          gap: 1,
          p: 2,
          pb: "48px",
          background: colors.background,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          sx={{
            width: "100%",
            color: colors.text,
            background: colors.expense,
            textTransform: "none",
          }}
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete {isIncome === "true" ? "income" : "expense"}
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={{
            width: "100%",
            color: colors.text,
            background: "#2662ec",
            textTransform: "none",
            "&:disabled": {
              background: colors.disabled,
              color: colors.textSecondary,
            },
          }}
          disabled={!isDirty}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
      <DeleteExpenseDialog
        id={Number(entryId)}
        isIncome={isIncome === "true"}
        onSuccess={() => router.back()}
        showConfirm={showDeleteDialog}
        setShowConfirm={setShowDeleteDialog}
        tgUser={tgUser}
      />
    </Box>
  );
};

export default ExpenseDetail;
