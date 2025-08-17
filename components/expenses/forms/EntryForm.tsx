import React from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "../../../src/contexts/ThemeContext";
import { AttachMoney } from "@mui/icons-material";
import { Control, Controller } from "react-hook-form";
import {
  Category,
  Expense,
  ExpenseFormData,
  ExpenseShare,
  Income,
} from "../../../utils/types";
import { useUser } from "../../../hooks/useUser";
import { TelegramUser } from "../../dashboard";

interface EntryFormProps {
  control: Control<ExpenseFormData>;
  categories: Category[];
  isIncome: boolean;
  isLoading: boolean;
  date: string;
  tgUser: TelegramUser;
  initData: string;
  chat_id: string;
  expense?: Expense | Income;
}

export default function EntryForm({
  control,
  categories,
  isIncome,
  isLoading,
  date,
  tgUser,
  initData,
  chat_id,
  expense,
}: EntryFormProps) {
  const { colors } = useTheme();
  const { data: user } = useUser(tgUser?.id, initData, chat_id as string);
  const hasExpenseShares =
    !isIncome &&
    expense &&
    "shares" in expense &&
    expense.shares &&
    expense.shares.length > 0;

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

  const renderFormLabel = (label: string) => (
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
      {label}
    </Typography>
  );

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      color: colors.text,
      background: colors.surface,
      borderRadius: 2,
      "& fieldset": {
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
  };

  const displayUsername = (
    user_id: number | string,
    name: string | undefined,
    username: string | undefined
  ) => {
    if (!name || !username) {
      return "Unknown";
    }

    if (user_id.toString() === user?.id?.toString()) {
      return "You";
    } else {
      return `${name} (@${username})`;
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Date and Time (Read-only) */}
      <Box>
        {renderFormLabel("DATE & TIME")}
        <Typography
          sx={{
            color: colors.textSecondary,
            fontSize: "0.9rem",
            padding: "12px 16px",
            background: colors.surface,
            borderRadius: 1,
          }}
        >
          {formatDateTime(date)}
        </Typography>
      </Box>

      {/* Description */}
      <Box>
        {renderFormLabel("DESCRIPTION")}
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              placeholder="Enter description"
              disabled={isLoading}
              sx={inputStyles}
            />
          )}
        />
      </Box>

      {/* Amount */}
      <Box>
        {renderFormLabel("AMOUNT")}
        <Controller
          name="amount"
          control={control}
          rules={{
            validate: (value) => {
              const numValue = parseFloat(value);
              if (isNaN(numValue) || numValue <= 0) {
                return "Amount must be greater than 0";
              }
              return true;
            },
          }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              type="number"
              placeholder="0.00"
              disabled={isLoading}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              inputProps={{
                min: "0.01",
                step: "0.01",
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ color: colors.text }} fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
          )}
        />
      </Box>

      {/* Category */}
      <Box>
        {renderFormLabel("CATEGORY")}
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
                  ...inputStyles["& .MuiOutlinedInput-root"],
                  "& .MuiSelect-icon": {
                    color: colors.textSecondary,
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      background: colors.card,
                      "& .MuiMenuItem-root": {
                        color: colors.text,
                        "&.Mui-selected": {
                          background: colors.primary,
                          color: colors.text,
                        },
                      },
                    },
                  },
                }}
              >
                {categories
                  .filter((c) => c.is_income === isIncome)
                  .map((category) => (
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

      {/* Expense Shares - Only show for group expenses */}
      {hasExpenseShares && (
        <Box>
          {renderFormLabel("EXPENSE SHARES")}
          <Box
            sx={{
              background: colors.surface,
              borderRadius: 2,
              p: 2,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary,
                fontSize: "0.8rem",
                mb: 1.5,
              }}
            >
              This expense is shared among group members:
            </Typography>

            {expense.shares?.map((share: ExpenseShare, index: number) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1,
                  px: 1.5,
                  mb: 1,
                  background: colors.card,
                  borderRadius: 1,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: colors.primary,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.text,
                      fontWeight: 500,
                    }}
                  >
                    {displayUsername(share.user_id, share.name, share.username)}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.primary,
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  ${share.share_amount.toFixed(2)}
                </Typography>
              </Box>
            ))}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pt: 1.5,
                mt: 1.5,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: colors.text,
                  fontWeight: 600,
                }}
              >
                Total Amount
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.text,
                  fontWeight: 600,
                  fontSize: "1rem",
                }}
              >
                ${Math.abs(expense.amount as number).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
