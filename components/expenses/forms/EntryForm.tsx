import React, { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import useMeasure from "react-use-measure";
import { Box } from "@mui/material";
import { DimensionsContext } from "../../AppLayout";
import { useTheme } from "../../../src/contexts/ThemeContext";
import BottomSheet from "../../common/BottomSheet";
import {
  Expense,
  Income,
  ExpenseFormData,
  Category,
  ExpenseShare,
  UnifiedEntry,
} from "../../../utils/types";
import DateTimePicker from "../../datetimepicker/DateTimePicker";
import KeypadButtons from "./KeypadButtons";
import DatetimeBar from "./DatetimeBar";
import SplitExpenseBottomSheet from "./SplitExpenseBottomSheet";
import EntryDetail from "./EntryDetail";
import { useFormManagement } from "./hooks/useFormManagement";
import { useSplitExpense } from "./hooks/useSplitExpense";
import LoadingSkeleton from "../../dashboard/LoadingSkeleton";

export enum FormValues {
  DESCRIPTION = "description",
  AMOUNT = "amount",
  CATEGORY_ID = "category_id",
  DATE = "date",
  SHARES = "shares",
}

interface EntryFormProps {
  entryId?: string;
  isIncome: boolean;
  categories: Category[];
  chat_id: string;
  expense?: Expense | Income;
  isGroupExpense?: boolean;
  onToggleRecurring?: () => void;
  setShowDeleteDialog: (show: boolean) => void;
  refreshCache?: () => void;
  updateExpenseInCache?: (updatedExpense: UnifiedEntry) => void;
}

export default function EntryForm({
  entryId,
  isIncome,
  categories,
  chat_id,
  expense,
  isGroupExpense = false,
  onToggleRecurring,
  setShowDeleteDialog,
  refreshCache,
  updateExpenseInCache,
}: EntryFormProps) {
  const { colors } = useTheme();
  const dimensions = useContext(DimensionsContext);
  const isExpense = typeof expense === "object" && "shares" in expense;

  // React Hook Form setup
  const defaultValues: ExpenseFormData = {
    description: expense?.description || "",
    amount: expense?.amount?.toString() || "0",
    category_id: expense?.category?.id || 0,
    date: expense?.date || "",
    shares:
      isExpense && (expense as Expense)?.shares
        ? (expense as Expense).shares!
        : [],
  };

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isDirty, isLoading, dirtyFields },
  } = useForm<ExpenseFormData>({
    defaultValues,
    mode: "onChange",
  });

  // Watch form values
  const currentAmount = watch("amount");
  const description = watch("description");
  const selectedCategoryId = watch("category_id");
  const selectedDateTime = watch("date");

  // State to prevent form reset after split save
  const [recentSplitSave, setRecentSplitSave] = useState(false);

  // Form management hook
  const {
    filteredCategories,
    selectedCategory,
    handleFormSubmit,
    handleBackspace,
  } = useFormManagement({
    entryId,
    expense,
    isIncome,
    categories,
    chat_id,
    selectedCategoryId: selectedCategoryId as number,
    selectedDateTime:
      selectedDateTime && selectedDateTime !== ""
        ? new Date(selectedDateTime)
        : expense?.date
        ? new Date(expense.date)
        : new Date(),
    handleSubmit,
    reset,
    formState: { dirtyFields },
  });

  type FormValue = string | number | ExpenseShare[];

  const handleFormValues = (value: FormValue, name: FormValues) => {
    setValue(name, value, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  // Split expense logic
  const {
    isCustomSplit,
    setEditExpenseShare,
    splitValidationErrors,
    splitHasChanges,
    setSplitHasChanges,
    splitInputValues,
    setSplitInputValues,
    setSplitValidationErrors,
    displayAmount,
    handleSplitApplyChanges,
    resetSplitChanges,
    handleSplitModeToggle,
  } = useSplitExpense({
    expense: expense as Expense,
    isExpense,
    chat_id,
    currentAmount,
    setValue,
    refreshCache,
    updateExpenseInCache,
    reset,
  });

  useEffect(() => {
    if (expense) {
      let categoryId = 0;
      if (
        expense.category &&
        typeof expense.category === "object" &&
        "id" in expense.category
      ) {
        categoryId = expense.category.id as number;
      } else if (typeof expense.category === "string") {
        // Find category by name in the categories array
        const foundCategory = categories.find(
          (cat) => cat.name === (expense.category as unknown as string)
        );
        categoryId = foundCategory?.id as number;
      }

      const newDefaultValues: ExpenseFormData = {
        description: expense.description || "",
        amount: expense.amount?.toString() || "0",
        category_id: categoryId || 0,
        date: expense.date || "",
        shares:
          isExpense && (expense as Expense)?.shares
            ? (expense as Expense).shares!
            : [],
      };

      // Only reset form if we're not in the middle of split changes or recently saved split changes
      // This prevents the form from reverting when split expense updates happen
      if (!splitHasChanges && !recentSplitSave) {
        reset(newDefaultValues);
      }
    }
  }, [expense, reset, isExpense, categories, splitHasChanges, recentSplitSave]);

  // UI state
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [showSplitExpenseSheet, setShowSplitExpenseSheet] = useState(false);

  // Measure the fixed bottom section height
  const [bottomSectionRef, bottomSectionBounds] = useMeasure();

  // Use initial device height minus bottom nav, ignoring keyboard changes
  const calculateHeight = () => {
    let initialHeight = 0;
    if (window.screen.height < 1920) {
      // Use the initial screen dimensions, not current viewport which changes with keyboard
      initialHeight = window.screen.height || dimensions.height;
    } else {
      initialHeight = dimensions.height;
    }
    const bottomNavigationHeight = 100;
    return initialHeight - bottomNavigationHeight;
  };

  // Custom backspace handler that works with the form
  const handleFormBackspace = () => {
    handleBackspace(
      currentAmount,
      (value) => handleFormValues(value, FormValues.AMOUNT),
      isCustomSplit
    );
  };

  // Wrapped split apply changes to prevent form reset
  const wrappedHandleSplitApplyChanges = async () => {
    setRecentSplitSave(true);
    const result = await handleSplitApplyChanges();
    return result;
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <form>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: `${calculateHeight()}px`,
            width: "100%",
            overflow: "hidden",
            transition: "height 0.2s ease-out",
          }}
        >
          <EntryDetail
            isGroupExpense={isGroupExpense && isExpense}
            expense={expense}
            currentAmount={currentAmount}
            selectedCategory={selectedCategory}
            handleBackspace={handleFormBackspace}
            handleFormValues={handleFormValues}
            description={description}
            isCustomSplit={isCustomSplit}
            filteredCategories={filteredCategories}
            isIncome={isIncome}
          />
          {/* Bottom Section - Always at bottom */}
          <Box
            ref={bottomSectionRef}
            sx={{
              width: "100%",
              flexShrink: 0, // Prevent shrinking
              backgroundColor: colors.background,
            }}
          >
            <DatetimeBar
              onDelete={() => setShowDeleteDialog(true)}
              onToggleRecurring={onToggleRecurring}
              isGroupExpense={isGroupExpense}
              isIncome={isIncome}
              setShowDateTimePicker={setShowDateTimePicker}
              selectedDateTime={new Date(selectedDateTime)}
              showFloatingPanel={showFloatingPanel}
              setShowFloatingPanel={setShowFloatingPanel}
              isCustomSplit={isCustomSplit}
              setEditExpenseShare={setEditExpenseShare}
              setShowSplitExpenseSheet={setShowSplitExpenseSheet}
              bottomSectionBounds={bottomSectionBounds}
            />
            <KeypadButtons
              onSubmit={handleFormSubmit}
              currentAmount={currentAmount}
              hasChanges={isDirty}
              isCustomSplit={isCustomSplit}
              onAmountChange={(value) =>
                handleFormValues(value, FormValues.AMOUNT)
              }
              onBackspace={handleFormBackspace}
              selectedDateTime={new Date(selectedDateTime)}
            />
          </Box>
        </Box>
      </form>

      {/* Overlay when floating panel is open */}
      {isGroupExpense && showFloatingPanel && !isIncome && (
        <Box
          onClick={() => setShowFloatingPanel(false)}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 999, // Lower than the floating panel but higher than other content
            animation: "fadeIn 0.2s ease-out",
            "@keyframes fadeIn": {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        />
      )}
      {/* Date/Time Picker Bottom Sheet */}
      <BottomSheet
        open={showDateTimePicker}
        onClose={() => setShowDateTimePicker(false)}
        height="25rem"
      >
        <DateTimePicker
          date={new Date(selectedDateTime)}
          onDateChange={(newDateTime) => {
            handleFormValues(newDateTime.toISOString(), FormValues.DATE);
          }}
        />
      </BottomSheet>
      {/* Split Expense Bottom Sheet */}
      {isExpense && (
        <SplitExpenseBottomSheet
          showSplitExpenseSheet={showSplitExpenseSheet}
          setShowSplitExpenseSheet={setShowSplitExpenseSheet}
          splitHasChanges={splitHasChanges}
          setSplitHasChanges={setSplitHasChanges}
          setEditExpenseShare={setEditExpenseShare}
          handleSplitApplyChanges={wrappedHandleSplitApplyChanges}
          handleSplitModeToggle={handleSplitModeToggle}
          resetSplitChanges={resetSplitChanges}
          splitValidationErrors={splitValidationErrors}
          expenseShares={expense?.shares || []}
          expense={expense}
          currentAmount={currentAmount}
          displayAmount={displayAmount}
          isExpense={isExpense}
          isCustomSplit={isCustomSplit}
          splitInputValues={splitInputValues}
          setSplitInputValues={setSplitInputValues}
          setSplitValidationErrors={setSplitValidationErrors}
          isDirty={isDirty}
        />
      )}
    </>
  );
}
