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
import { AppLayout, DimensionsContext } from "../../AppLayout";
import { useTheme } from "../../../src/contexts/ThemeContext";
import {
  DeleteOutline,
  RepeatOutlined,
  CheckOutlined,
  Backspace,
  CalendarMonth,
  MoreVert,
  Close,
  Group,
  CallSplit,
  GraphicEq,
} from "@mui/icons-material";
import BottomSheet from "../../common/BottomSheet";
import SplitInfoTooltip from "../../common/SplitInfoTooltip";
import { Category, Expense, Income } from "../../../utils/types";
import { TelegramUser } from "../../dashboard";
import { alpha } from "@mui/material/styles";
import DateTimePicker from "../../datetimepicker/DateTimePicker";
import CategoryPicker from "../CategoryPicker";
import { cleanCategoryName } from "../../../utils/categoryUtils";
import SplitExpense from "../../expenseShare/SplitExpense";
import {
  updateExpenseAmount,
  updateExpenseShares,
} from "../../../services/expenses";
import { useQueryClient } from "@tanstack/react-query";

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

  // Generate consistent colors for categories
  const getCategoryColor = (categoryName: string) => {
    const colorPalette = [
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#45B7D1", // Blue
      "#96CEB4", // Green
      "#FECA57", // Yellow
      "#FF9FF3", // Pink
      "#54A0FF", // Light Blue
      "#5F27CD", // Purple
      "#00D2D3", // Cyan
      "#FF9F43", // Orange
      "#A55EEA", // Violet
      "#26DE81", // Mint
      "#FD79A8", // Rose
      "#FDCB6E", // Peach
      "#6C5CE7", // Indigo
    ];

    const hash = categoryName.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };
  // const { data: user } = useUser(tgUser?.id, initData, chat_id as string);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(
    parentSelectedDateTime || new Date(date)
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [showSplitExpenseSheet, setShowSplitExpenseSheet] = useState(false);

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
  // Format date exactly like the screenshot: "Sat, 9 Aug"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Format time exactly like the screenshot: "11:43"
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Auto-scroll to the end when amount changes
  useEffect(() => {
    if (amountScrollRef.current) {
      amountScrollRef.current.scrollLeft = amountScrollRef.current.scrollWidth;
    }
  }, [currentAmount]);

  // Handle keypad input
  const handleKeypadPress = (value: string) => {
    // Only disable amount editing when actively editing a custom split
    if (editExpenseShare && isCustomSplit()) {
      return;
    }

    if (value === "." && currentAmount.includes(".")) return;

    let newAmount: string;
    if (currentAmount === "0" && value !== ".") {
      newAmount = value;
    } else {
      newAmount = currentAmount + value;
    }

    onAmountChange(newAmount);
  };

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

  // Render keypad button
  const renderKeypadButton = (value: string, isSpecial = false) => {
    const isDisabled = originalIsCustomSplit();
    return (
      <Button
        key={value}
        onClick={() =>
          value === "⌫" ? handleBackspace() : handleKeypadPress(value)
        }
        disabled={isDisabled}
        sx={{
          width: "100%",
          height: 72,
          borderRadius: 3,
          backgroundColor: isDisabled
            ? alpha(colors.border, 0.5)
            : isSpecial
            ? colors.primary
            : colors.border,
          color: isDisabled
            ? alpha(colors.text, 0.3)
            : isSpecial
            ? colors.background
            : colors.text,
          fontSize: "1.5rem",
          fontWeight: 500,
          border: "none",

          "&:active": {
            transform: isDisabled ? "none" : "scale(0.98)",
          },
          "&:disabled": {
            color: alpha(colors.text, 0.3),
          },
        }}
      >
        {value}
      </Button>
    );
  };

  return (
    <AppLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: `${dimensions.height}px`,
          width: `${dimensions.width}px`,
          overflow: "hidden",
          boxSizing: "border-box",
          position: "absolute",
          top: 0,
          left: 0,
          px: 2,
          pb: 4,
        }}
      >
        {/* Scrollable Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            boxSizing: "border-box",
            minHeight: "70vh",
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

          {/* Main Display Area */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              px: 4,
              gap: 4,
              minHeight: "60vh",
              pb:
                bottomSectionBounds.height > 0
                  ? `${bottomSectionBounds.height + 16}px`
                  : "200px", // Dynamic padding based on measured height
            }}
          >
            {/* Category Selector Chip*/}
            <Chip
              label={selectedCategory?.name || "Select Category"}
              sx={{
                backgroundColor: selectedCategory?.name
                  ? getCategoryColor(
                      cleanCategoryName(selectedCategory.name).name
                    )
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
                    borderBottom: `1px solid ${alpha(
                      colors.textSecondary,
                      0.3
                    )}`,
                  },
                  "&:hover:not(.Mui-disabled):before": {
                    borderBottom: `1px solid ${alpha(
                      colors.textSecondary,
                      0.6
                    )}`,
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

          {/* Floating Panel for Group Actions */}
          {isGroupExpense && showFloatingPanel && !isIncome && (
            <Box
              sx={{
                position: "fixed",
                right: "0.8rem",
                bottom: `${bottomSectionBounds.height - 12}px`, // Position just above the MoreVert icon
                backgroundColor: colors.surface,
                borderRadius: 3,
                boxShadow: `0 4px 20px ${colors.textSecondary}20`,
                p: 0.5,
                zIndex: 1002, // Higher than the overlay (999)
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                animation: "slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "@keyframes slideInFromRight": {
                  from: {
                    opacity: 0,
                    transform: "translateX(20px)",
                  },
                  to: {
                    opacity: 1,
                    transform: "translateX(0)",
                  },
                },
              }}
            >
              {/* Recurring Icon */}
              <IconButton
                onClick={onToggleRecurring}
                disabled={!onToggleRecurring}
                sx={{
                  color: colors.text,
                  width: 36,
                  height: 36,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: colors.border,
                    transform: "scale(1.1)",
                  },
                  "&:disabled": {
                    color: colors.textSecondary,
                  },
                }}
              >
                <RepeatOutlined fontSize="small" />
              </IconButton>

              {/* Group/Split Icon */}
              <IconButton
                onClick={() => {
                  // Auto-enable edit mode for custom splits
                  if (isCustomSplit()) {
                    setEditExpenseShare(true);
                  } else {
                    setEditExpenseShare(false);
                  }
                  setShowSplitExpenseSheet(true);
                  setShowFloatingPanel(false);
                }}
                sx={{
                  color: colors.text,
                  width: 36,
                  height: 36,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: colors.border,
                    transform: "scale(1.1)",
                  },
                }}
              >
                <Group fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* Fixed Bottom Section - Date/Time Bar and Keypad */}
          <Box
            ref={bottomSectionRef}
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              p: 1.5,
              backgroundColor: colors.background,
              transform: "translate3d(0, 0, 0)",
              WebkitTransform: "translate3d(0, 0, 0)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                py: 0.5,
                gap: 1,
                position: "relative",
                zIndex: 1000,
              }}
            >
              {/* Date and Time */}
              <Button
                onClick={() => setShowDateTimePicker(true)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: colors.border,
                  py: 1,
                  borderRadius: 3,
                  textTransform: "none",
                  flex: 1,
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CalendarMonth
                    fontSize="small"
                    sx={{ mr: 1, color: colors.text }}
                  />
                  <Typography
                    sx={{
                      color: colors.text,
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    {formatDate(selectedDateTime.toISOString())}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: colors.text,
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  {formatTime(selectedDateTime.toISOString())}
                </Typography>
              </Button>

              {/* Group-specific icons */}
              {isGroupExpense && !isIncome ? (
                <>
                  {/* Delete Icon - positioned beside date/time picker for groups */}
                  <IconButton
                    onClick={onDelete}
                    disabled={!onDelete}
                    sx={{
                      backgroundColor: colors.expense,
                      color: colors.background,
                      width: 32,
                      height: 32,
                      borderRadius: 3,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: colors.expense,
                      },
                    }}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>

                  {/* Three dots / Cross icon */}
                  <IconButton
                    onClick={() => setShowFloatingPanel(!showFloatingPanel)}
                    sx={{
                      backgroundColor: colors.border,
                      color: colors.text,
                      width: 32,
                      height: 32,
                      borderRadius: 3,
                    }}
                  >
                    {showFloatingPanel ? (
                      <Close fontSize="small" />
                    ) : (
                      <MoreVert fontSize="small" />
                    )}
                  </IconButton>
                </>
              ) : (
                <>
                  {/* Recurring Icon - non-group */}
                  <IconButton
                    onClick={onToggleRecurring}
                    disabled={!onToggleRecurring}
                    sx={{
                      backgroundColor: colors.border,
                      color: colors.text,
                      width: 32,
                      height: 32,
                      borderRadius: 3,
                      "&:disabled": {
                        color: colors.textSecondary,
                      },
                    }}
                  >
                    <RepeatOutlined fontSize="small" />
                  </IconButton>
                  {/* Delete Icon - non-group */}
                  <IconButton
                    onClick={onDelete}
                    disabled={!onDelete}
                    sx={{
                      backgroundColor: colors.expense,
                      color: colors.background,
                      width: 32,
                      height: 32,
                      borderRadius: 3,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: colors.expense,
                      },
                    }}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>

            {/* Keypad */}
            <Box
              sx={{
                mt: "auto", // Push to bottom
                pt: 1,
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 1.5,
                  pb: 3,
                }}
              >
                {/* Row 1 */}
                {renderKeypadButton("1")}
                {renderKeypadButton("2")}
                {renderKeypadButton("3")}

                {/* Row 2 */}
                {renderKeypadButton("4")}
                {renderKeypadButton("5")}
                {renderKeypadButton("6")}

                {/* Row 3 */}
                {renderKeypadButton("7")}
                {renderKeypadButton("8")}
                {renderKeypadButton("9")}

                {/* Row 4 */}
                {renderKeypadButton(".")}
                {renderKeypadButton("0")}

                {/* Submit Button (Save) */}
                <Button
                  onClick={() => {
                    onDateTimeChange?.(selectedDateTime);
                    onSubmit?.();
                  }}
                  disabled={!onSubmit || currentAmount === "0" || !hasChanges}
                  sx={{
                    height: 72,
                    borderRadius: 3,
                    backgroundColor: colors.background,
                    color: colors.text,
                    border: `2px solid ${
                      hasChanges ? colors.text : alpha(colors.text, 0.1)
                    }`,
                    "&:disabled": {
                      backgroundColor: colors.background,
                      color: alpha(colors.text, 0.1),
                    },
                  }}
                >
                  <CheckOutlined sx={{ fontSize: "2rem" }} />
                </Button>
              </Box>
            </Box>
          </Box>

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
                          const newInputValues: Record<
                            string | number,
                            string
                          > = {};
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
                            const currentValue =
                              splitInputValues[share.user_id];
                            return (
                              currentValue &&
                              Math.abs(
                                parseFloat(currentValue) -
                                  parseFloat(equalAmount)
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
      </Box>
    </AppLayout>
  );
}
