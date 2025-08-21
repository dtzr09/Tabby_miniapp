import {
  backButton,
  init,
  showPopup,
  settingsButton,
} from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Alert } from "@mui/material";
import {
  Category,
  ExpenseFormData,
  TelegramWebApp,
} from "../../../../utils/types";
import { useForm } from "react-hook-form";
import DeleteExpenseDialog from "../../../../components/expenses/utils/DeleteExpenseDialog";
import { TelegramUser } from "../../../../components/dashboard";
import EntryForm from "../../../../components/expenses/forms/EntryForm";
import LoadingSkeleton from "../../../../components/dashboard/LoadingSkeleton";
import { useExpense } from "../../../../hooks/useExpense";
import { useAllEntries } from "../../../../hooks/useAllEntries";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "../../../../hooks/useUser";
import BottomSheet from "../../../../components/common/BottomSheet";
import { invalidateExpenseCache } from "../../../../utils/cache";

const ExpenseDetail = () => {
  const router = useRouter();
  const { id: entryId, isIncome, chat_id, isGroupView } = router.query;
  const { colors } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string | undefined>(undefined);
  const [currentAmount, setCurrentAmount] = useState("0");
  const [description, setDescription] = useState("");
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
    // control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    setValue,
  } = useForm<ExpenseFormData>({
    defaultValues,
    mode: "onChange",
  });

  const hasExpenseShares =
    isGroupView !== "true" && expense?.shares && expense.shares.length > 0;

  // Reset form when expense data changes
  useEffect(() => {
    if (expense) {
      const amount = hasExpenseShares
        ? expense.shares
            .find((share: { user_id: number }) => share.user_id === user?.id)
            ?.share_amount.toString()
        : expense.amount.toString();

      setCurrentAmount(amount || "0");
      setDescription(expense.description || "");

      reset(
        {
          description: expense.description || "",
          amount: amount || "",
          category_id: expense.category?.id || 0,
        },
        { keepDirty: false }
      );
    }
  }, [expense, reset, user, isGroupView, hasExpenseShares]);

  // Initialize Telegram WebApp
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeApp = async () => {
      try {
        init(); // Initialize Telegram WebApp
        backButton.mount(); // Mount back button
        backButton.show(); // Show back button
        backButton.onClick(() => router.back());

        // Hide settings button on entries page
        if (settingsButton.isMounted()) {
          settingsButton.hide();
        }

        const webApp = window.Telegram?.WebApp as TelegramWebApp;
        if (!webApp?.initData) {
          console.log("⏳ Waiting for Telegram WebApp to initialize...");
          setTimeout(initializeApp, 25);
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

    // Cleanup function to restore settings button when leaving entries page
    return () => {
      try {
        if (settingsButton.isMounted()) {
          settingsButton.show();
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [entryId, router]);

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

        // Invalidate expense cache after successful update
        invalidateExpenseCache(user.id.toString(), chat_id as string);
        console.log("🗑️ Cache invalidated after expense update");

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
    [entryId, isIncome, expense, categories, updateExpenseInCache, chat_id]
  );

  // Handler functions for the new EntryForm
  const handleAmountChange = (value: string) => {
    setCurrentAmount(value);
    // Update the react-hook-form control as well
    const formValue = value === "0" ? "" : value;
    setValue("amount", formValue, { shouldDirty: true });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setValue("description", value, { shouldDirty: true });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleFormSubmit = () => {
    // Update form data before submitting
    setValue("description", description, { shouldDirty: true });
    setValue("amount", currentAmount === "0" ? "" : currentAmount, {
      shouldDirty: true,
    });
    setShowSaveDialog(true);
  };

  const handleCategoryChange = (category: Category) => {
    setValue("category_id", category.id, { shouldDirty: true });
  };

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
        background: colors.background,
        px: 2,
        display: "flex",
        flexDirection: "column",
        pt: 4,
        height: "var(--app-height)",
        overflow: "hidden",
      }}
    >
      <EntryForm
        // control={control}
        categories={categories}
        isIncome={isIncome === "true"}
        // isLoading={isLoading}
        date={expense.date}
        expense={expense}
        // tgUser={tgUser as TelegramUser}
        // initData={initData as string}
        // chat_id={chat_id as string}
        // isGroupExpense={chat_id !== tgUser?.id?.toString()}
        onDelete={handleDelete}
        // onToggleRecurring={() => console.log("Recurring not implemented")}
        // onShowSplit={() => console.log("Show split not implemented")}
        onSubmit={handleFormSubmit}
        currentAmount={currentAmount}
        onAmountChange={handleAmountChange}
        description={description}
        onDescriptionChange={handleDescriptionChange}
        onCategoryChange={handleCategoryChange}
      />

      <DeleteExpenseDialog
        id={Number(entryId)}
        isIncome={isIncome === "true"}
        onSuccess={() => {
          setShowDeleteDialog(false);
          router.back();
        }}
        showConfirm={showDeleteDialog}
        setShowConfirm={setShowDeleteDialog}
        tgUser={tgUser}
        deleteFromCache={deleteExpenseFromCache}
      />

      {/* Save Changes Bottom Sheet */}
      <BottomSheet
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title={`Save ${isIncome === "true" ? "Income" : "Expense"} Changes`}
        description="Are you sure you want to save these changes?"
        buttons={[
          {
            text: isSubmitting ? "Saving..." : "Save Changes",
            onClick: () => {
              setShowSaveDialog(false);
              handleSubmit(onSubmit)();
            },
            variant: "primary",
            disabled: isSubmitting,
          },
          {
            text: "Cancel",
            onClick: () => setShowSaveDialog(false),
            variant: "secondary",
          },
        ]}
      />
    </Box>
  );
};

export default ExpenseDetail;
