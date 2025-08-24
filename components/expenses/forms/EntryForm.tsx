import React, {
  useState,
  useRef,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import useMeasure from "react-use-measure";
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
} from "@mui/material";
import { DimensionsContext } from "../../AppLayout";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { Backspace, CallSplit, GraphicEq } from "@mui/icons-material";
import BottomSheet from "../../common/BottomSheet";
import SplitInfoTooltip from "../../common/SplitInfoTooltip";
import { Category, Expense, Income } from "../../../utils/types";
import { TelegramUser } from "../../dashboard";
import { alpha } from "@mui/material/styles";
import DateTimePicker from "../../datetimepicker/DateTimePicker";
import CategoryPicker from "../CategoryPicker";
import { cleanCategoryName } from "../../../utils/categoryUtils";
import { getCategoryColor } from "../../../utils/categoryColors";
import SplitExpense from "../../expenseShare/SplitExpense";
import {
  updateExpenseAmount,
  updateExpenseShares,
} from "../../../services/expenses";
import { useQueryClient } from "@tanstack/react-query";
import KeypadButtons from "./KeypadButtons";
import DatetimeBar from "./DatetimeBar";

interface EntryFormProps {
  // control: Control<ExpenseFormData>;
  categories: Category[];
  isIncome: boolean;
  // isLoading: boolean;
  date: string;
  tgUser?: TelegramUser;
  initData?: string;
  chat_id?: string;
  expense?: Expense | Income;
  isGroupExpense?: boolean;
  onDelete?: () => void;
  onToggleRecurring?: () => void;
  onShowSplit?: () => void;
  onSubmit?: () => void;
  currentAmount: string;
  onAmountChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (category: Category) => void;
  onDateTimeChange?: (dateTime: Date) => void;
  selectedDateTime?: Date;
  hasChanges?: boolean;
}

export default function EntryForm({
  // control,
  categories,
  isIncome,
  // isLoading,
  date,
  tgUser,
  initData,
  chat_id,
  expense,
  isGroupExpense = false,
  onDelete,
  onToggleRecurring,
  // onShowSplit,
  onSubmit,
  currentAmount,
  onAmountChange,
  description,
  onDescriptionChange,
  onCategoryChange,
  onDateTimeChange,
  selectedDateTime: parentSelectedDateTime,
  hasChanges = false,
}: EntryFormProps) {
  const { colors } = useTheme();
  const dimensions = useContext(DimensionsContext);
  const isExpense = typeof expense === "object" && "shares" in expense;
  const queryClient = useQueryClient();

  const originalIsCustomSplit = () => {
    if (!isExpense || !expense?.shares?.length) return false;
    const currentAmountValue = parseFloat(expense.amount.toString() || "0");
    const amountPerPerson = currentAmountValue / expense.shares.length;
    return !expense.shares.every(
      (share) => Math.abs(share.share_amount - amountPerPerson) < 0.01
    );
  };

  // Check if this is a custom split (not equal split)
  const isCustomSplit = () => {
    if (!isExpense || !expense?.shares?.length) return false;
    const currentAmountValue = parseFloat(currentAmount || "0");
    const amountPerPerson = currentAmountValue / expense.shares.length;
    return !expense.shares.every(
      (share) => Math.abs(share.share_amount - amountPerPerson) < 0.01
    );
  };

  const [editExpenseShare, setEditExpenseShare] = useState(false);

  // Split expense state
  const [splitValidationErrors, setSplitValidationErrors] = useState<
    Record<string | number, string>
  >({});
  const [splitHasChanges, setSplitHasChanges] = useState(false);
  const [splitInputValues, setSplitInputValues] = useState<
    Record<string | number, string>
  >({});

  // Calculate display amount - always use sum of individual shares for consistency
  const displayAmount = useMemo(() => {
    if (isExpense && expense?.shares) {
      // Always calculate total from individual shares for consistency
      const shares = (expense as Expense).shares;
      if (shares) {
        const total = shares.reduce((sum, share) => {
          if (editExpenseShare && splitInputValues[share.user_id]) {
            // In edit mode, use input values if available
            const inputValue = splitInputValues[share.user_id];
            const numericValue = parseFloat(inputValue);
            return (
              sum + (!isNaN(numericValue) ? numericValue : share.share_amount)
            );
          } else {
            // In view mode or when no input values, use original share amounts
            return sum + share.share_amount;
          }
        }, 0);
        return total.toFixed(2);
      }
    }
    // Fallback to currentAmount if no shares available
    return currentAmount || "0";
  }, [editExpenseShare, splitInputValues, currentAmount, isExpense, expense]);

  // Handle split expense changes
  const handleSplitApplyChanges = useCallback(async () => {
    if (!isExpense || !expense?.shares || !tgUser?.id || !initData || !chat_id)
      return;

    // Check if there are validation errors
    const hasErrors = Object.keys(splitValidationErrors).length > 0;
    if (hasErrors) return;

    // Create updated shares array
    const updatedShares = expense.shares.map((share) => {
      const inputValue = splitInputValues[share.user_id];
      const numericValue = parseFloat(inputValue);
      return {
        ...share,
        share_amount: !isNaN(numericValue) ? numericValue : share.share_amount,
      };
    });

    // Calculate new total from shares
    const newTotalFromShares = updatedShares.reduce(
      (sum, share) => sum + share.share_amount,
      0
    );

    try {
      // Update expense amount first
      await updateExpenseAmount(
        expense.id,
        newTotalFromShares,
        tgUser.id.toString(),
        initData,
        chat_id
      );

      // Then update expense shares
      await updateExpenseShares(
        expense.id,
        updatedShares.map((s) => ({
          user_id: s.user_id,
          share_amount: s.share_amount,
        })),
        tgUser.id.toString(),
        initData,
        chat_id
      );

      // Update cache after successful API calls
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(["expense", expense.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          amount: newTotalFromShares,
          shares: updatedShares,
        };
      });

      // Update allEntries cache
      queryClient.setQueryData(
        ["allEntries", tgUser.id.toString(), chat_id],
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        (oldData: any) => {
          if (!oldData || !oldData.expenses) return oldData;

          return {
            ...oldData,
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            expenses: oldData.expenses.map((exp: any) =>
              exp.id === expense.id
                ? { ...exp, amount: newTotalFromShares }
                : exp
            ),
          };
        }
      );

      // Update current amount in the form
      onAmountChange(newTotalFromShares.toString());
      setSplitHasChanges(false);

      // Close the bottom sheet
      setShowSplitExpenseSheet(false);

      // Reset split input values to match the new amounts
      if (expense?.shares) {
        const updatedInputValues: Record<string | number, string> = {};
        updatedShares.forEach((share) => {
          updatedInputValues[share.user_id] = share.share_amount.toString();
        });
        setSplitInputValues(updatedInputValues);
      }
    } catch (error) {
      console.error("Failed to update expense:", error);
    }
  }, [
    isExpense,
    expense,
    tgUser?.id,
    initData,
    chat_id,
    splitValidationErrors,
    splitInputValues,
    queryClient,
    onAmountChange,
  ]);

  // const { data: user } = useUser(tgUser?.id, initData, chat_id as string);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(
    parentSelectedDateTime || new Date(date)
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [showSplitExpenseSheet, setShowSplitExpenseSheet] = useState(false);

  // Keyboard height detection
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);

  // Measure the fixed bottom section height
  const [bottomSectionRef, bottomSectionBounds] = useMeasure();

  // Filter categories based on income/expense type
  const filteredCategories = categories.filter(
    (cat) => cat.is_income === isIncome
  );

  // Initialize with expense's category if available, otherwise use first filtered category
  const getInitialCategory = () => {
    if (
      expense?.category &&
      filteredCategories.some((cat) => cat.id === expense.category?.id)
    ) {
      return expense.category as Category;
    }
    if (filteredCategories.length > 0) {
      return filteredCategories[0];
    }
    return {
      id: 1,
      name: isIncome ? "Salary" : "Transport",
      emoji: isIncome ? "💰" : "🚗",
      is_income: isIncome,
    };
  };

  const [selectedCategory, setSelectedCategory] = useState<Category>(
    getInitialCategory()
  );
  const amountScrollRef = useRef<HTMLDivElement>(null);

  // Sync with parent selectedDateTime
  useEffect(() => {
    if (
      parentSelectedDateTime &&
      parentSelectedDateTime.getTime() !== selectedDateTime.getTime()
    ) {
      setSelectedDateTime(parentSelectedDateTime);
    }
  }, [parentSelectedDateTime, selectedDateTime]);

  // Memoized category initialization to prevent unnecessary re-renders
  const initializeCategoryFromExpense = useCallback(() => {
    if (expense?.category && filteredCategories.length > 0) {
      const expenseCategory = filteredCategories.find(
        (cat) => cat.id === expense.category?.id
      );
      if (expenseCategory) {
        setSelectedCategory(expenseCategory);
        onCategoryChange(expenseCategory);
      }
    }
  }, [expense?.category?.id, filteredCategories, onCategoryChange]);

  // Initialize category when expense changes (only once per expense)
  useEffect(() => {
    initializeCategoryFromExpense();
  }, [initializeCategoryFromExpense]); // Include the callback in dependencies

  // Handle income type changes
  useEffect(() => {
    if (filteredCategories.length > 0) {
      // Check if current selected category is still valid for the current type
      const isCurrentCategoryValid = filteredCategories.some(
        (cat) => cat.id === selectedCategory.id
      );
      if (!isCurrentCategoryValid) {
        const newCategory = filteredCategories[0];
        setSelectedCategory(newCategory);
        onCategoryChange(newCategory);
      }
    }
  }, [isIncome, filteredCategories.length]); // Only when income type changes or categories become available

  // Detect keyboard height
  useEffect(() => {
    const initialViewportHeight =
      window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      const currentViewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight - currentViewportHeight;

      // If viewport shrunk significantly (likely keyboard), store the keyboard height
      if (heightDifference > 150) {
        // Threshold to detect keyboard
        setKeyboardHeight(heightDifference);
      } else {
        setKeyboardHeight(0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener(
          "resize",
          handleViewportChange
        );
      };
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", handleViewportChange);
      return () => {
        window.removeEventListener("resize", handleViewportChange);
      };
    }
  }, []);

  const handleCategorySelect = (categoryName: string) => {
    // Find the category object from filtered categories array or create a new one
    const category = filteredCategories.find(
      (cat) => cat.name === categoryName
    ) || {
      id: categoryName,
      name: categoryName,
      emoji: "📝",
      is_income: isIncome,
    };

    setSelectedCategory(category);
    onCategoryChange(category);
  };

  // Auto-scroll to the end when amount changes
  useEffect(() => {
    if (amountScrollRef.current) {
      amountScrollRef.current.scrollLeft = amountScrollRef.current.scrollWidth;
    }
  }, [currentAmount]);

  // Handle backspace
  const handleBackspace = () => {
    // Only disable amount editing when actively editing a custom split
    if (editExpenseShare && isCustomSplit()) {
      return;
    }

    let newAmount: string;
    if (currentAmount.length > 1) {
      newAmount = currentAmount.slice(0, -1);
    } else {
      newAmount = "0";
    }

    onAmountChange(newAmount);
  };

  // Calculate dynamic height based on keyboard state
  const calculateHeight = () => {
    const bottomNavigationHeight = 100;
    const baseHeight = dimensions.height - bottomNavigationHeight;
    // Only rely on keyboard height detection, not focus state
    if (keyboardHeight > 0) {
      return baseHeight + keyboardHeight;
    }
    return baseHeight;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: `${calculateHeight()}px`,
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Top Section - Main Display Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
          gap: 4,
          width: "100%",
          position: "relative",
          minHeight: 0, // Allow flex item to shrink
        }}
      >
        {/* Split Info Tooltip - Only for group expenses */}
        {isGroupExpense && isExpense && (
          <Box
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 100,
            }}
          >
            <SplitInfoTooltip
              expense={expense}
              currentAmount={currentAmount}
              isEditMode={false}
            />
          </Box>
        )}

        {/* Category Selector Chip*/}
        <Chip
          label={selectedCategory?.name || "Select Category"}
          sx={{
            backgroundColor: selectedCategory?.name
              ? getCategoryColor(cleanCategoryName(selectedCategory.name).name)
              : colors.border,
            color: selectedCategory?.name ? "white" : colors.text,
            fontSize: "0.8rem",
            fontWeight: 500,
            borderRadius: 2,
            padding: "2px 4px",
            height: "auto",
            textTransform: "none",
            cursor: "pointer",
            width: "fit-content",
            boxShadow: selectedCategory?.name
              ? `0 2px 6px ${getCategoryColor(
                  cleanCategoryName(selectedCategory.name).name
                )}40`
              : "none",
          }}
          onClick={() => {
            setShowCategoryPicker(true);
          }}
        />

        {/* Amount Display with Delete Button */}
        <Box
          sx={{
            textAlign: "center",
            position: "relative",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            ref={amountScrollRef}
            sx={{
              maxWidth: "50%", // Account for backspace button width + more padding
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              scrollbarWidth: "none",
            }}
          >
            <Typography
              sx={{
                fontSize: "4rem",
                fontWeight: 300,
                color: colors.text,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {currentAmount}
            </Typography>
          </Box>

          {/* Backspace Button positioned further to the right */}
          <IconButton
            onClick={handleBackspace}
            disabled={originalIsCustomSplit()}
            sx={{
              backgroundColor: colors.surface,
              color: colors.text,
              width: 32,
              height: 32,
              position: "absolute",
              right: 0,
            }}
          >
            <Backspace fontSize="small" />
          </IconButton>
        </Box>

        {/* Description Input Field */}
        <TextField
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter description"
          variant="standard"
          onFocus={() => setIsDescriptionFocused(true)}
          onBlur={() => setIsDescriptionFocused(false)}
          inputProps={{
            inputMode: "text",
            autoComplete: "off",
            autoCorrect: "off",
            spellCheck: false,
          }}
          sx={{
            width: "70%",
            "& .MuiInput-root": {
              fontSize: "1.1rem",
              fontWeight: 500,
              "&:before": {
                borderBottom: `1px solid ${alpha(colors.textSecondary, 0.3)}`,
              },
              "&:hover:not(.Mui-disabled):before": {
                borderBottom: `1px solid ${alpha(colors.textSecondary, 0.6)}`,
              },
              "&:after": {
                borderBottom: `2px solid ${colors.primary}`,
              },
            },
            "& .MuiInputBase-input": {
              textAlign: "center",
              color: colors.text,
              backgroundColor: "transparent",
              padding: "8px 0",
              "&::placeholder": {
                color: colors.textSecondary,
                opacity: 0.7,
              },
            },
          }}
        />
      </Box>

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
          onDelete={onDelete}
          onToggleRecurring={onToggleRecurring}
          isGroupExpense={isGroupExpense}
          isIncome={isIncome}
          setShowDateTimePicker={setShowDateTimePicker}
          selectedDateTime={selectedDateTime}
          showFloatingPanel={showFloatingPanel}
          setShowFloatingPanel={setShowFloatingPanel}
          isCustomSplit={isCustomSplit}
          setEditExpenseShare={setEditExpenseShare}
          setShowSplitExpenseSheet={setShowSplitExpenseSheet}
          bottomSectionBounds={bottomSectionBounds}
        />
        <KeypadButtons
          onDateTimeChange={onDateTimeChange}
          onSubmit={onSubmit}
          currentAmount={currentAmount}
          hasChanges={hasChanges}
          originalIsCustomSplit={originalIsCustomSplit}
          editExpenseShare={editExpenseShare}
          isCustomSplit={isCustomSplit}
          onAmountChange={onAmountChange}
          onBackspace={handleBackspace}
          selectedDateTime={selectedDateTime}
        />
      </Box>

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
          date={selectedDateTime}
          onDateChange={(newDateTime) => {
            setSelectedDateTime(newDateTime);
            // Notify parent component of date/time changes
            onDateTimeChange?.(newDateTime);
          }}
          onClose={() => setShowDateTimePicker(false)}
        />
      </BottomSheet>

      {/* Category Picker Bottom Sheet */}
      <BottomSheet
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Categories"
      >
        <CategoryPicker
          open={showCategoryPicker}
          categories={filteredCategories}
          onClose={() => setShowCategoryPicker(false)}
          selectedCategory={selectedCategory.name}
          onCategorySelect={handleCategorySelect}
        />
      </BottomSheet>

      {/* Split Expense Bottom Sheet */}
      {isExpense && (
        <BottomSheet
          open={showSplitExpenseSheet}
          onClose={() => {
            setShowSplitExpenseSheet(false);
            // Reset changes when closing the sheet
            setSplitHasChanges(false);
            setEditExpenseShare(false);
          }}
          title="Split Expense"
          titleIcon={
            <SplitInfoTooltip
              expense={expense}
              currentAmount={currentAmount}
              isEditMode={editExpenseShare}
            />
          }
          description={`$${parseFloat(displayAmount).toFixed(2)}  •  ${
            isExpense && expense?.shares && expense?.shares?.length
          } people`}
          buttons={[
            {
              text: "Save",
              onClick: handleSplitApplyChanges,
              disabled:
                Object.keys(splitValidationErrors).length > 0 ||
                !splitHasChanges,
              variant: "primary",
            },
          ]}
          actionButtons={
            <Box sx={{ display: "flex", gap: 1 }}>
              {/* Edit/Equal Split Toggle Button */}
              <Button
                onClick={() => {
                  if (editExpenseShare && isCustomSplit()) {
                    // Switching from custom split to equal split - populate equal amounts
                    if (expense?.shares) {
                      const totalAmount = parseFloat(displayAmount);
                      const equalAmount = (
                        totalAmount / expense.shares.length
                      ).toFixed(2);

                      // Update input values with equal amounts
                      const newInputValues: Record<string | number, string> =
                        {};
                      expense.shares.forEach((share) => {
                        newInputValues[share.user_id] = equalAmount;
                      });
                      setSplitInputValues(newInputValues);
                      setSplitHasChanges(true); // Enable save button for this change
                    }
                  } else if (editExpenseShare && !isCustomSplit()) {
                    // Switching from equal split to custom split - check if values actually changed
                    if (expense?.shares) {
                      const totalAmount = parseFloat(displayAmount);
                      const equalAmount = (
                        totalAmount / expense.shares.length
                      ).toFixed(2);

                      // Check if current input values are different from equal amounts
                      const hasChanges = expense.shares.some((share) => {
                        const currentValue = splitInputValues[share.user_id];
                        return (
                          currentValue &&
                          Math.abs(
                            parseFloat(currentValue) - parseFloat(equalAmount)
                          ) > 0.01
                        );
                      });

                      setSplitHasChanges(hasChanges);
                    }
                  } else if (!editExpenseShare) {
                    // Initialize input values with current shares
                    if (expense?.shares) {
                      const currentInputValues: Record<
                        string | number,
                        string
                      > = {};
                      expense.shares.forEach((share) => {
                        currentInputValues[share.user_id] =
                          share.share_amount.toString();
                      });
                      setSplitInputValues(currentInputValues);
                      setSplitHasChanges(false); // No changes initially
                    }
                  }

                  setEditExpenseShare(!editExpenseShare);
                }}
                sx={{
                  color: colors.text,
                  textTransform: "none",
                  borderRadius: 6,
                  backgroundColor: colors.border,
                  p: 1,
                }}
              >
                {editExpenseShare && !isCustomSplit() ? (
                  <GraphicEq
                    fontSize="small"
                    sx={{
                      mr: 0.5,
                      fontSize: "0.9rem",
                      color: colors.text,
                    }}
                  />
                ) : (
                  <CallSplit
                    fontSize="small"
                    sx={{
                      mr: 0.5,
                      fontSize: "0.9rem",
                      color: colors.text,
                    }}
                  />
                )}

                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.8rem",
                    letterSpacing: 1,
                    fontWeight: 550,
                  }}
                >
                  {editExpenseShare ? "Split Evenly" : "Custom Split"}
                </Typography>
              </Button>
            </Box>
          }
        >
          <SplitExpense
            expense={expense}
            editExpenseShare={editExpenseShare}
            currentAmount={currentAmount}
            onValidationChange={setSplitValidationErrors}
            onHasChangesChange={setSplitHasChanges}
            onInputValuesChange={setSplitInputValues}
          />
        </BottomSheet>
      )}
    </Box>
  );
}
