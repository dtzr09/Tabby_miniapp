import {
  backButton,
  init,
  settingsButton,
  showPopup,
} from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Box, Button, Alert } from "@mui/material";
import DeleteExpenseDialog from "../../../../components/expenses/utils/DeleteExpenseDialog";
import EntryForm from "../../../../components/expenses/forms/EntryForm";
import LoadingSkeleton from "../../../../components/dashboard/LoadingSkeleton";
import { useExpense } from "../../../../hooks/useExpense";
import { useAllEntries } from "../../../../hooks/useAllEntries";
import { AppLayout } from "../../../../components/AppLayout";
import { useTelegramWebApp } from "../../../../hooks/useTelegramWebApp";
import { UnifiedEntry } from "../../../../utils/types";

const ExpenseDetail = () => {
  const router = useRouter();
  const { id: entryId, isIncome, chat_id } = router.query;
  const { user: tgUser, initData } = useTelegramWebApp();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cachedExpense, setCachedExpense] = useState<UnifiedEntry | null>(null);

  // Get categories from useAllEntries
  const { categories } = useAllEntries(tgUser?.id, initData, chat_id as string);

  // Try to get expense data from sessionStorage first (instant loading)
  useEffect(() => {
    if (typeof window !== 'undefined' && entryId) {
      const cached = sessionStorage.getItem(`expense_${entryId}`);
      if (cached) {
        try {
          const parsedExpense = JSON.parse(cached);
          setCachedExpense(parsedExpense);
        } catch (error) {
          console.warn('Failed to parse cached expense data:', error);
        }
      }
    }

    // Cleanup function to remove sessionStorage data when leaving the page
    return () => {
      if (typeof window !== 'undefined' && entryId) {
        sessionStorage.removeItem(`expense_${entryId}`);
      }
    };
  }, [entryId]);

  // Get expense data with cache-first strategy (fallback only)
  const {
    data: expense,
    isLoading,
    isError,
    error,
    deleteExpenseFromCache,
    refreshCache,
    updateExpenseInCache,
  } = useExpense({
    id: entryId as string,
    isIncome: isIncome === "true",
    userId: tgUser?.id,
    initData: initData,
    chat_id: chat_id as string,
  });

  // Use cached expense if available, otherwise fall back to fetched data
  const finalExpense = cachedExpense || expense;

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

  // Handle loading and error states - only show loading if no cached data available
  if ((!cachedExpense && isLoading) || !finalExpense || categories.length === 0) {
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

  return (
    <AppLayout>
      <EntryForm
        entryId={entryId as string}
        isIncome={isIncome === "true"}
        expense={finalExpense}
        categories={categories}
        chat_id={chat_id as string}
        isGroupExpense={chat_id !== tgUser?.id?.toString()}
        setShowDeleteDialog={setShowDeleteDialog}
        refreshCache={refreshCache}
        updateExpenseInCache={updateExpenseInCache}
        onToggleRecurring={() => {
          try {
            showPopup({
              title: "Coming Soon",
              message: "Recurring expenses will be available soon!",
              buttons: [{ type: "ok" }],
            });
          } catch {
            console.log("Recurring expenses will be available soon!");
          }
        }}
        // onShowSplit={() => console.log("Show split not implemented")}
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
    </AppLayout>
  );
};

export default ExpenseDetail;
