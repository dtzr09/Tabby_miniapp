import { backButton, init, showPopup } from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Alert } from "@mui/material";
import { ExpenseFormData, TelegramWebApp } from "../../../../utils/types";
import { useForm } from "react-hook-form";
import DeleteExpenseDialog from "../../../../components/expenses/utils/DeleteExpenseDialog";
import { TelegramUser } from "../../../../components/dashboard";
import EntryForm from "../../../../components/expenses/forms/EntryForm";
import LoadingSkeleton from "../../../../components/dashboard/LoadingSkeleton";
import { useExpense } from "../../../../hooks/useExpense";
import { useAllEntries } from "../../../../hooks/useAllEntries";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "../../../../hooks/useUser";

const ExpenseDetail = () => {
  const router = useRouter();
  const { id: entryId, isIncome, chat_id, isGroupView } = router.query;
  const { colors } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string | undefined>(undefined);
  // Get categories from useAllEntries
  const { categories } = useAllEntries(tgUser?.id, initData, chat_id as string);
  const { data: user } = useUser(tgUser?.id, initData, chat_id as string);

  // Get expense data with cache-first strategy
  const {
    data: expense,
    isLoading,
    isError,
    error,
    updateExpenseInCache,
    deleteExpenseFromCache,
  } = useExpense({
    id: entryId as string,
    isIncome: isIncome === "true",
    userId: tgUser?.id,
    initData,
    chat_id: chat_id as string,
  });

  const defaultValues: ExpenseFormData = {
    description: "",
    amount: "",
    category_id: 0,
  };

  const {
    control,
    handleSubmit,
    formState: { isDirty, isSubmitting, errors },
    reset,
  } = useForm<ExpenseFormData>({
    defaultValues,
    mode: "onChange",
  });

  const hasExpenseShares =
    isGroupView !== "true" && expense?.shares && expense.shares.length > 0;

  // Reset form when expense data changes
  useEffect(() => {
    if (expense) {
      reset(
        {
          description: expense.description || "",
          amount: hasExpenseShares
            ? expense.shares
                .find(
                  (share: { user_id: number }) => share.user_id === user?.id
                )
                ?.share_amount.toString()
            : expense.amount.toString(),
          category_id: expense.category?.id || 0,
        },
        { keepDirty: false }
      );
    }
  }, [expense, reset, user, isGroupView]);

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
          console.error("Missing required data");
          return;
        }

        // Create the updated expense object
        const updatedExpense = {
          ...expense,
          description: data.description,
          amount: parseFloat(data.amount),
          category: categories.find((c) => c.id === data.category_id),
        };

        // Optimistically update the cache
        updateExpenseInCache(updatedExpense);

        // Make the API call in the background
        const response = await fetch(`/api/entries/${entryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: user.id.toString(),
            initData: webAppInitData,
            ...data,
            amount: parseFloat(data.amount),
            isIncome: isIncome === "true",
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

        showPopup({
          title: "Success",
          message: `${
            isIncome === "true" ? "Income" : "Expense"
          } updated successfully`,
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
    [entryId, isIncome, expense, categories, updateExpenseInCache, router]
  );

  // Handle loading and error states
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error
            ? error.message
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
        expense={expense}
        tgUser={tgUser as TelegramUser}
        initData={initData as string}
        chat_id={chat_id as string}
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
          disabled={!isDirty || Object.keys(errors).length > 0}
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
        deleteFromCache={deleteExpenseFromCache}
      />
    </Box>
  );
};

export default ExpenseDetail;
