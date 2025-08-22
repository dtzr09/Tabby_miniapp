import React, { useState, useContext } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
} from "@mui/material";
import { DimensionsContext } from "../../AppLayout";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useTheme } from "../../../src/contexts/ThemeContext";
import {
  DeleteOutline,
  RepeatOutlined,
  CheckOutlined,
  Backspace,
  CalendarMonth,
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
  // isGroupExpense = false,
  onDelete,
  onToggleRecurring,
  // onShowSplit,
  onSubmit,
  currentAmount,
  onAmountChange,
  description,
  onDescriptionChange,
  onCategoryChange,
}: EntryFormProps) {
  const { colors } = useTheme();
  const dimensions = useContext(DimensionsContext);
  // const { data: user } = useUser(tgUser?.id, initData, chat_id as string);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(new Date(date));
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
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
      hour12: false,
    });
  };

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
          }}
        >
          {/* Category Selector Chip*/}
          <Chip
            label={
              categories.find(
                (category) => category.id === expense?.category?.id
              )?.name
            }
            sx={{
              backgroundColor: colors.border,
              color: colors.text,
              fontSize: "0.8rem",
              fontWeight: 500,
              borderRadius: 2,
              padding: "2px 4px",
              height: "auto",
              textTransform: "none",
              cursor: "pointer",
              width: "fit-content",
            }}
            onClick={() => {
              // setShowCategoryPicker(true);
            }}
          />
          {/* Amount Display with Delete Button */}
          <Box
            sx={{
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "4rem",
                fontWeight: 300,
                color: colors.text,
                lineHeight: 1,
              }}
            >
              {currentAmount}
            </Typography>

            {/* Backspace Button to the right of amount */}
            <IconButton
              onClick={handleBackspace}
              sx={{
                backgroundColor: colors.surface,
                color: colors.text,
                width: 32,
                height: 32,
                "&:hover": {
                  backgroundColor: colors.border,
                  transform: "none",
                },
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
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            gap: 1,
            position: "relative",
            zIndex: 1000,
          }}
        >
          {/* Date and Time */}
          <Button
            onClick={() => setShowDateTimePicker(false)}
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: colors.border,
              px: 2.5,
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

          {/* Recurring Icon */}
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
          {/* Delete Icon */}
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
              onClick={onSubmit}
              disabled={!onSubmit || currentAmount === "0"}
              sx={{
                height: 72,
                borderRadius: 3,
                backgroundColor: colors.background,
                color: colors.text,
                border: `2px solid ${colors.text}`,
                "&:disabled": {
                  backgroundColor: colors.border,
                  color: colors.textSecondary,
                  border: `2px solid ${colors.textSecondary}`,
                },
              }}
            >
              <CheckOutlined sx={{ fontSize: "2rem" }} />
            </Button>
          </Box>
        </Box>

        {/* Inline DateTime Picker */}
        {showDateTimePicker && (
          <Box
            sx={{
              position: "absolute",
              backgroundColor: colors.surface,
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(colors.text, 0.2)}`,
              border: `1px solid ${colors.border}`,
              zIndex: 1000,
              mb: 2,
              overflow: "hidden",
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                value={selectedDateTime}
                onChange={(newValue: Date | null) => {
                  if (newValue) {
                    setSelectedDateTime(newValue);
                  }
                }}
                slotProps={{
                  textField: {
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: colors.surface,
                        border: "none",
                        "& fieldset": {
                          border: "none",
                        },
                        "&:hover": {
                          backgroundColor: colors.surface,
                        },
                        "&.Mui-focused": {
                          backgroundColor: colors.surface,
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: colors.text,
                        fontSize: "0.9rem",
                        padding: "8px 12px",
                      },
                    },
                  },
                  popper: {
                    sx: {
                      "& .MuiPaper-root": {
                        backgroundColor: colors.surface,
                        boxShadow: `0 8px 32px ${alpha(colors.text, 0.2)}`,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 3,
                      },
                      "& .MuiPickersLayout-root": {
                        backgroundColor: colors.surface,
                        "& .MuiPickersLayout-toolbar": {
                          backgroundColor: colors.surface,
                          "& .MuiPickersLayout-toolbarText": {
                            color: colors.text,
                            fontSize: "1rem",
                            fontWeight: 600,
                          },
                        },
                        "& .MuiPickersLayout-actionBar": {
                          backgroundColor: colors.surface,
                          "& .MuiButton-root": {
                            color: colors.primary,
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            textTransform: "none",
                          },
                        },
                        "& .MuiDayCalendar-root": {
                          backgroundColor: colors.surface,
                          "& .MuiPickersCalendarHeader-root": {
                            backgroundColor: colors.surface,
                            "& .MuiPickersCalendarHeader-label": {
                              color: colors.text,
                              fontSize: "0.9rem",
                              fontWeight: 600,
                            },
                            "& .MuiIconButton-root": {
                              color: colors.text,
                              "&:hover": {
                                backgroundColor: alpha(colors.primary, 0.1),
                              },
                            },
                          },
                          "& .MuiDayCalendar-weekDayLabel": {
                            color: colors.textSecondary,
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          },
                          "& .MuiPickersDay-root": {
                            color: colors.text,
                            fontSize: "0.8rem",
                            width: "28px",
                            height: "28px",
                            margin: "1px",
                            "&.Mui-selected": {
                              backgroundColor: colors.primary,
                              color: colors.background,
                            },
                            "&:hover": {
                              backgroundColor: alpha(colors.primary, 0.1),
                            },
                            "&.MuiPickersDay-today": {
                              border: `1px solid ${colors.primary}`,
                            },
                          },
                        },
                        "& .MuiClock-root": {
                          backgroundColor: colors.surface,
                          "& .MuiClockNumber-root": {
                            color: colors.text,
                            fontSize: "0.8rem",
                            "&.Mui-selected": {
                              backgroundColor: colors.primary,
                              color: colors.background,
                            },
                          },
                          "& .MuiClockPointer-root": {
                            backgroundColor: colors.primary,
                          },
                          "& .MuiClockPointer-thumb": {
                            backgroundColor: colors.primary,
                            border: `1px solid ${colors.background}`,
                          },
                        },
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        )}

        {/* Date/Time Picker Bottom Sheet - Commented Out */}
        {/* <BottomSheet
        open={showDateTimePicker}
        onClose={() => setShowDateTimePicker(false)}
        title="Select Date & Time"
        buttons={[
          {
            text: "Confirm",
            onClick: () => {
              // Combine selected date and time
              const newDate = new Date(selectedDate);
              const [hours, minutes] = selectedTime.split(":");
              newDate.setHours(parseInt(hours), parseInt(minutes));

              setShowDateTimePicker(false);
            },
            variant: "primary",
          },
          {
            text: "Cancel",
            onClick: () => setShowDateTimePicker(false),
            variant: "secondary",
          },
        ]}
      >
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: colors.primary,
                fontWeight: 600,
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                mb: 1,
                display: "block",
              }}
            >
              Date
            </Typography>
            <TextField
              type="date"
              value={selectedDate.toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: colors.surface,
                  borderRadius: 2,
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover": {
                    backgroundColor: alpha(colors.surface, 0.8),
                  },
                  "&.Mui-focused": {
                    backgroundColor: colors.surface,
                  },
                },
                "& .MuiInputBase-input": {
                  color: colors.text,
                  padding: "12px 16px",
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              variant="overline"
              sx={{
                color: colors.primary,
                fontWeight: 600,
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                mb: 1,
                display: "block",
              }}
            >
              Time
            </Typography>
            <TextField
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)} 
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: colors.surface,
                  borderRadius: 2,
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover": {
                    backgroundColor: alpha(colors.surface, 0.8),
                  },
                  "&.Mui-focused": {
                    backgroundColor: colors.surface,
                  },
                },
                "& .MuiInputBase-input": {
                  color: colors.text,
                  padding: "12px 16px",
                },
              }}
            />
          </Box>
        </Box>
      </BottomSheet> */}

        {/* Category Picker Bottom Sheet */}
        <BottomSheet
          open={showCategoryPicker}
          onClose={() => setShowCategoryPicker(false)}
          title="Select Category"
          buttons={[
            {
              text: "Confirm",
              onClick: () => setShowCategoryPicker(false),
              variant: "primary",
            },
            {
              text: "Cancel",
              onClick: () => setShowCategoryPicker(false),
              variant: "secondary",
            },
          ]}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 1,
            }}
          >
            {categories
              .filter((category) => category.is_income === isIncome)
              .map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  sx={{
                    backgroundColor: colors.border,
                    color: colors.text,
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    borderRadius: 2,
                    height: "auto",
                    textTransform: "none",
                  }}
                  onClick={() => {
                    onCategoryChange(category);
                    setShowCategoryPicker(false);
                  }}
                />
              ))}
          </Box>
        </BottomSheet>
      </Box>
    </Box>
  );
}
