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
import { Category } from "../../../utils/types";

interface EntryFormData {
  description: string;
  amount: string;
  category_id: number;
}

interface EntryFormProps {
  control: Control<EntryFormData>;
  categories: Category[];
  isIncome: boolean;
  isLoading: boolean;
  date: string;
}

export default function EntryForm({
  control,
  categories,
  isIncome,
  isLoading,
  date,
}: EntryFormProps) {
  const { colors } = useTheme();

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

      {/* Transaction Type */}
      <Box>
        {renderFormLabel("TYPE")}
        <Typography
          sx={{
            color: colors.textSecondary,
            fontSize: "0.9rem",
            padding: "12px 16px",
            background: colors.surface,
            borderRadius: 1,
          }}
        >
          {isIncome ? "Income" : "Expense"}
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
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              type="number"
              placeholder="0.00"
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ color: "white" }} fontSize="small" />
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
    </Box>
  );
} 