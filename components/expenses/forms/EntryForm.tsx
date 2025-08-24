import React, {
  useState,
  useRef,
  useContext,
  useEffect,
  useCallback,
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
import {
  DeleteOutline,
  RepeatOutlined,
  CheckOutlined,
  Backspace,
  CalendarMonth,
  MoreVert,
  Close,
  Group,
  Edit,
  Check,
} from "@mui/icons-material";
import BottomSheet from "../../common/BottomSheet";
// import { Control } from "react-hook-form";
import {
  Category,
  Expense,
  // ExpenseFormData,
  Income,
} from "../../../utils/types";
// import { TelegramUser } from "../../dashboard";
import { alpha } from "@mui/material/styles";
import DateTimePicker from "../../datetimepicker/DateTimePicker";
import CategoryPicker from "../CategoryPicker";
import { cleanCategoryName } from "../../../utils/categoryUtils";
import SplitExpense from "../../expenseShare/SplitExpense";

interface EntryFormProps {
  // control: Control<ExpenseFormData>;
  categories: Category[];
  isIncome: boolean;
  // isLoading: boolean;
  date: string;
  // tgUser: TelegramUser;
  // initData: string;
  // chat_id: string;
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
  // tgUser,
  // initData,
  // chat_id,
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
  const [editExpenseShare, setEditExpenseShare] = useState(false);

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
      if (expenseCategory && expenseCategory.id !== selectedCategory.id) {
        setSelectedCategory(expenseCategory);
        onCategoryChange(expenseCategory);
      }
    }
  }, [
    expense?.category?.id,
    filteredCategories,
    selectedCategory.id,
    onCategoryChange,
  ]);

  // Initialize category when expense changes (only once per expense)
  useEffect(() => {
    initializeCategoryFromExpense();
  }, [expense?.id]); // Only when expense ID changes (new expense loaded)

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
    if (value === "." && currentAmount.includes(".")) return;

    if (currentAmount === "0" && value !== ".") {
      onAmountChange(value);
    } else {
      onAmountChange(currentAmount + value);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (currentAmount.length > 1) {
      onAmountChange(currentAmount.slice(0, -1));
    } else {
      onAmountChange("0");
    }
  };

  // Render keypad button
  const renderKeypadButton = (value: string, isSpecial = false) => (
    <Button
      key={value}
      onClick={() =>
        value === "⌫" ? handleBackspace() : handleKeypadPress(value)
      }
      sx={{
        width: "100%",
        height: 72,
        borderRadius: 3,
        backgroundColor: isSpecial ? colors.primary : colors.border,
        color: isSpecial ? colors.background : colors.text,
        fontSize: "1.5rem",
        fontWeight: 500,
        border: "none",
        "&:hover": {
          backgroundColor: isSpecial
            ? alpha(colors.primary, 0.9)
            : alpha(colors.border, 0.9),
          transform: "none",
        },
        "&:active": {
          transform: "scale(0.98)",
        },
      }}
    >
      {value}
    </Button>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: `${dimensions.height}px`,
        width: `${dimensions.width}px`,
        overflow: "hidden",
        boxSizing: "border-box",
        top: 0,
        left: 0,
        px: 2,
        pb: 4,
        // Prevent viewport changes when keyboard opens
        position: "fixed",
        transform: "translate3d(0, 0, 0)",
        WebkitTransform: "translate3d(0, 0, 0)",
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
        }}
      >
        {/* Main Display Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            px: 4,
            gap: 3,
            pt: 4,
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

        {/* Date/Time Bar with Right-Aligned Icons */}
        <Box
          ref={bottomSectionRef}
          sx={{ position: "fixed", bottom: 0, left: 0, right: 0, p: 1 }}
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
                px: 1,
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
                zIndex: 1000,
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
                position: "absolute",
                right: "0.5rem",
                top: `calc(100% - ${bottomSectionBounds.height + 80}px)`, // Position above the fixed bottom section (keypad area)
                backgroundColor: colors.surface,
                borderRadius: 3,
                boxShadow: `0 4px 20px ${colors.textSecondary}20`,
                p: 0.5,
                zIndex: 1001,
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
            onClose={() => setShowSplitExpenseSheet(false)}
            title="Split Expense"
            description={`$${expense?.amount.toFixed(2)}  · ${
              isExpense && expense?.shares && expense?.shares?.length
            } people`}
            actionButtons={
              <Button
                onClick={() => {
                  setEditExpenseShare(!editExpenseShare);
                }}
                sx={{
                  color: colors.text,
                  textTransform: "none",
                  borderRadius: 6,
                  backgroundColor: editExpenseShare
                    ? colors.primary
                    : colors.border,
                  p: 1,
                }}
              >
                {editExpenseShare ? (
                  <Check
                    fontSize="small"
                    sx={{
                      mr: 0.5,
                      fontSize: "0.9rem",
                      color: colors.text,
                    }}
                  />
                ) : (
                  <Edit
                    fontSize="small"
                    sx={{ mr: 0.5, fontSize: "0.9rem", color: colors.text }}
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
                  {editExpenseShare ? "Done" : "Edit"}
                </Typography>
              </Button>
            }
          >
            <SplitExpense
              expense={expense}
              editExpenseShare={editExpenseShare}
            />
          </BottomSheet>
        )}
      </Box>
    </Box>
  );
}
