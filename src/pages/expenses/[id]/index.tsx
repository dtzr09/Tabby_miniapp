import { backButton, init, showPopup } from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import { useTheme } from "../../../contexts/ThemeContext";
import { TelegramWebApp } from "../../../../utils/types";
import { useForm } from "react-hook-form";
import DeleteExpenseDialog from "../../../../components/expenses/utils/DeleteExpenseDialog";
import { useQueryClient } from "@tanstack/react-query";
import { refetchExpensesQueries } from "../../../../utils/refetchExpensesQueries";
import { TelegramUser } from "../../../../components/dashboard";
import EntryForm from "../../../../components/expenses/forms/EntryForm";
import { useEntryData } from "../../../../hooks/useEntryData";
import LoadingSkeleton from "../../../../components/dashboard/LoadingSkeleton";

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
  const queryClient = useQueryClient();

  const { isLoading, expense, categories, loadData } = useEntryData({
    entryId: entryId as string,
    isIncome: isIncome === "true",
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

  // Initialize Telegram WebApp and load data
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
        const initData = webApp.initData;

        if (!user?.id || !initData || !entryId) {
          console.error("Missing required data");
          return;
        }

        setTgUser(user as TelegramUser);
        await loadData(user.id.toString(), initData);
      } catch (err) {
        console.error("Error initializing expense detail:", err);
      }
    };

    initializeApp();
  }, [entryId, loadData, reset]); // Remove expense from dependencies

  const onSubmit = useCallback(
    async (data: ExpenseFormData) => {
      try {
        const webApp = window.Telegram?.WebApp as TelegramWebApp;
        const user = webApp.initDataUnsafe?.user;
        const initData = webApp.initData;

        if (!user?.id || !initData || !entryId) {
          console.error("Missing Telegram user/init data or expense ID");
          return;
        }

        const response = await fetch(`/api/entries/${entryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: user.id.toString(),
            initData,
            ...data,
            amount: parseFloat(data.amount),
            isIncome: isIncome === "true",
          }),
        });

        if (!response.ok) {
          console.error("Failed to update entry:", await response.text());
          return;
        }

        await refetchExpensesQueries(queryClient, user.id.toString());

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
      }
    },
    [reset, entryId, isIncome]
  );

  if (isLoading || !expense) {
    return <LoadingSkeleton />;
  }

  return (
    <Box
      sx={{
        height: "100%",
        background: colors.background,
        px: 2,
        display: "flex",
        flexDirection: "column",
        pt: "var(--safe-top)",
        pb: "var(--safe-bottom)",
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
