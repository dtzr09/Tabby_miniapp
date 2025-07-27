import {
  backButton,
  init,
  mainButton,
  setMainButtonParams,
  showPopup,
} from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Skeleton,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "../../../contexts/ThemeContext";
import { TelegramWebApp } from "../../../../utils/types";
import { useForm, Controller } from "react-hook-form";

interface Category {
  id: number;
  name: string;
  emoji?: string;
}

interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  is_income: boolean;
  category?: Category;
}

interface ExpenseFormData {
  description: string;
  amount: string;
  category_id: number;
  is_income: boolean;
}

const ExpenseDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const defaultValues: ExpenseFormData = {
    description: "",
    amount: "",
    category_id: 0,
    is_income: false,
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

  // Load categories from backend (commented out for mock data testing)
  const loadCategories = useCallback(
    async (telegram_id: string, initData: string): Promise<boolean> => {
      try {
        const params = new URLSearchParams({
          telegram_id,
          initData,
        });

        const response = await fetch(`/api/categories?${params.toString()}`);

        if (!response.ok) {
          console.error("Failed to load categories:", response.statusText);
          return false;
        }

        const data = await response.json();
        setCategories(data.categories || []);
        return true;
      } catch (error) {
        console.error("❌ Error loading categories:", error);
        return false;
      }
    },
    []
  );

  // Load expense detail from backend (commented out for mock data testing)
  const loadExpenseDetail = useCallback(
    async (
      expenseId: string,
      telegram_id: string,
      initData: string
    ): Promise<boolean> => {
      try {
        const params = new URLSearchParams({
          telegram_id,
          initData,
        });

        const response = await fetch(
          `/api/expenses/${expenseId}?${params.toString()}`
        );

        if (!response.ok) {
          console.error("Failed to load expense:", response.statusText);
          return false;
        }

        const data = await response.json();
        setExpense(data.expense);

        // Update form with expense data
        const formData = {
          description: data.expense.description || "",
          amount: Math.abs(data.expense.amount).toString(),
          category_id: data.expense.category?.id || 0,
          is_income: data.expense.is_income || false,
        };

        // Reset the form with the expense data as the new baseline
        reset(formData, { keepDirty: false });

        return true;
      } catch (error) {
        console.error("❌ Error loading expense:", error);
        return false;
      }
    },
    [reset]
  );

  // Initialize Telegram WebApp and load data
  useEffect(() => {
    if (typeof window !== "undefined") {
      init();

      setTimeout(async () => {
        try {
          backButton.mount();
          backButton.show();

          backButton.onClick(() => {
            router.back();
          });

          mainButton.mount();

          // Uncomment this section when ready to use real API
          const webApp = window.Telegram?.WebApp as TelegramWebApp;
          if (webApp && !isLoading) {
            const user = webApp.initDataUnsafe?.user;
            const initData = webApp.initData;

            if (user?.id && initData) {
              setIsLoading(true);
              try {
                // Load categories and expense detail in parallel
                await Promise.all([
                  loadCategories(user.id.toString(), initData),
                  loadExpenseDetail(id as string, user.id.toString(), initData),
                ]);
              } catch (error) {
                console.error("Error loading data:", error);
              } finally {
                setIsLoading(false);
              }
            }
          }
        } catch (err) {
          console.error("Error initializing expense detail:", err);
        }
      }, 0);
    }
  }, []);

  // Update button parameters when theme colors change
  useEffect(() => {
    if (typeof window !== "undefined" && setMainButtonParams.isAvailable()) {
      try {
        const isEnabled = !isSubmitting && !isLoading && isDirty;
        const baseColor = colors.primary.startsWith("#")
          ? colors.primary
          : `#${colors.primary}`;

        const enabledColor = colors.surface.startsWith("#")
          ? colors.surface
          : `#${colors.surface}`;

        const enabledTextColor = colors.text.startsWith("#")
          ? colors.text
          : `#${colors.text}`;

        const disabledTextColor = colors.disabled.startsWith("#")
          ? colors.disabled
          : `#${colors.disabled}`;

        const backgroundColor = isEnabled
          ? (baseColor as `#${string}`)
          : (enabledColor as `#${string}`);

        const textColor = isEnabled
          ? (enabledTextColor as `#${string}`)
          : (disabledTextColor as `#${string}`);

        setMainButtonParams({
          backgroundColor,
          isEnabled,
          isLoaderVisible: isSubmitting,
          isVisible: true,
          text: isSubmitting ? "Saving..." : isLoading ? "Loading..." : "Save",
          textColor,
        });
      } catch (err) {
        console.error("Error updating button parameters:", err);
      }
    }
  }, [
    colors.primary,
    colors.text,
    colors.surface,
    colors.disabled,
    isSubmitting,
    isLoading,
    isDirty,
  ]);

  const onSubmit = useCallback(
    async (data: ExpenseFormData) => {
      try {
        const webApp = window.Telegram?.WebApp as TelegramWebApp;
        const user = webApp.initDataUnsafe?.user;
        const initData = webApp.initData;

        if (!user?.id || !initData || !id) {
          console.error("Missing Telegram user/init data or expense ID");
          return;
        }

        const response = await fetch(`/api/expenses/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: user.id.toString(),
            initData,
            ...data,
            ...data,
            amount: parseFloat(data.amount),
          }),
        });

        if (!response.ok) {
          console.error("Failed to update expense:", await response.text());
          return;
        }
        showPopup({
          title: "Success",
          message: "Expense updated successfully",
          buttons: [
            {
              type: "ok",
            },
          ],
        });

        reset(data, { keepDirty: false });
      } catch (err) {
        console.error("Error updating expense:", err);
      }
    },
    [reset]
  );

  useEffect(() => {
    if (mainButton && mainButton.onClick) {
      const handleClick = handleSubmit(onSubmit);
      mainButton.onClick(handleClick);

      return () => {
        mainButton.offClick(handleClick);
      };
    }
  }, [handleSubmit, onSubmit]);

  if (isLoading || !expense) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Skeleton
            variant="rectangular"
            sx={{ height: 60, borderRadius: 1, bgcolor: colors.surface }}
          />
          <Skeleton
            variant="rectangular"
            sx={{ height: 60, borderRadius: 1, bgcolor: colors.surface }}
          />
          <Skeleton
            variant="rectangular"
            sx={{ height: 60, borderRadius: 1, bgcolor: colors.surface }}
          />
          <Skeleton
            variant="rectangular"
            sx={{ height: 60, borderRadius: 1, bgcolor: colors.surface }}
          />
        </Box>
      </Box>
    );
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: colors.background,
        px: 2,
        py: 1,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Date and Time (Read-only) */}
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: colors.primary,
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 1,
            }}
          >
            DATE & TIME
          </Typography>
          <Typography
            sx={{
              color: colors.textSecondary,
              fontSize: "0.9rem",
              padding: "12px 16px",
              background: colors.surface,
              borderRadius: 1,
            }}
          >
            {formatDateTime(expense.date)}
          </Typography>
        </Box>

        {/* Description */}
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: colors.primary,
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 1,
            }}
          >
            DESCRIPTION
          </Typography>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                placeholder="Enter description"
                disabled={isLoading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: colors.text,
                    background: colors.inputBg,
                    borderRadius: 2,
                    "& fieldset": {
                      border: "none",
                    },
                    "&:hover fieldset": {
                      border: "none",
                    },
                    "&.Mui-focused fieldset": {
                      border: "none",
                    },
                    "& .MuiInputBase-input": {
                      padding: "12px 16px",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: colors.textSecondary,
                    opacity: 0.7,
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Amount */}
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: colors.primary,
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 1,
            }}
          >
            AMOUNT
          </Typography>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type="number"
                placeholder="0.00"
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: colors.text,
                    background: colors.inputBg,
                    borderRadius: 2,
                    "& fieldset": {
                      border: "none",
                    },
                    "&:hover fieldset": {
                      border: "none",
                    },
                    "&.Mui-focused fieldset": {
                      border: "none",
                    },
                    "& .MuiInputBase-input": {
                      padding: "12px 16px",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: colors.textSecondary,
                    opacity: 0.7,
                  },
                }}
              />
            )}
          />
        </Box>

        {/* Category */}
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: colors.primary,
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 1,
            }}
          >
            CATEGORY
          </Typography>
          <FormControl fullWidth>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || 0}
                  onChange={field.onChange}
                  disabled={isLoading}
                  displayEmpty
                  renderValue={(value) => {
                    const category = categories.find((c) => c.id === value);
                    return category
                      ? `${category.emoji || ""} ${category.name}`
                      : "Select category";
                  }}
                  sx={{
                    color: colors.text,
                    background: colors.inputBg,
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "& .MuiSelect-icon": {
                      color: colors.textSecondary,
                    },
                    "& .MuiSelect-select": {
                      padding: "12px 16px",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        background: colors.card,
                        "& .MuiMenuItem-root": {
                          color: colors.text,
                          "&:hover": {
                            background: colors.surface,
                          },
                          "&.Mui-selected": {
                            background: colors.primary,
                            color: colors.text,
                            "&:hover": {
                              background: colors.primary,
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Typography sx={{ color: "inherit" }}>
                        {category.emoji || ""} {category.name}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Box>

        {/* Transaction Type */}
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: colors.primary,
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 1,
            }}
          >
            TYPE
          </Typography>
          <FormControl fullWidth>
            <Controller
              name="is_income"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value ? "income" : "expense"}
                  onChange={(e) => field.onChange(e.target.value === "income")}
                  disabled={isLoading}
                  sx={{
                    color: colors.text,
                    background: colors.inputBg,
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "& .MuiSelect-icon": {
                      color: colors.textSecondary,
                    },
                    "& .MuiSelect-select": {
                      padding: "12px 16px",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        background: colors.card,
                        "& .MuiMenuItem-root": {
                          color: colors.text,
                          "&:hover": {
                            background: colors.surface,
                          },
                          "&.Mui-selected": {
                            background: colors.primary,
                            color: colors.text,
                            "&:hover": {
                              background: colors.primary,
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                </Select>
              )}
            />
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

export default ExpenseDetail;
