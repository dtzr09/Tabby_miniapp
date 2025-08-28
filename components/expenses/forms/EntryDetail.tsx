import {
  alpha,
  Box,
  Chip,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import SplitInfoTooltip from "../../common/SplitInfoTooltip";
import { Expense, Income } from "../../../utils/types";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Category } from "../../../utils/types";
import { getCategoryColor } from "../../../utils/categoryColors";
import { cleanCategoryName } from "../../../utils/categoryUtils";
import BottomSheet from "../../common/BottomSheet";
import CategoryPicker from "../CategoryPicker";
import { Backspace } from "@mui/icons-material";
import { FormValues } from "./EntryForm";
import { ExpenseShare } from "../../../utils/types";

type FormValue = string | number | ExpenseShare[];

interface EntryDetailProps {
  isGroupExpense: boolean;
  expense: Expense | Income | undefined;
  isCustomSplit: boolean;
  currentAmount: string;
  selectedCategory: Category;
  handleBackspace: () => void;
  description: string;
  handleFormValues: (value: FormValue, name: FormValues) => void;
  filteredCategories: Category[];
  isIncome: boolean;
}
const EntryDetail = (props: EntryDetailProps) => {
  const { colors, isDark } = useTheme();
  const amountScrollRef = useRef<HTMLDivElement>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleCategorySelect = (categoryName: string) => {
    // Find the category object from filtered categories array
    const category = props.filteredCategories.find(
      (cat) => cat.name === categoryName
    );

    if (category) {
      props.handleFormValues(category.id, FormValues.CATEGORY_ID);
    } else {
      console.error(
        "Selected category not found in filteredCategories:",
        categoryName
      );
    }
  };

  // Auto-scroll to the end when amount changes
  useEffect(() => {
    if (amountScrollRef.current) {
      amountScrollRef.current.scrollLeft = amountScrollRef.current.scrollWidth;
    }
  }, [props.currentAmount]);

  const categoryColor = getCategoryColor(
    cleanCategoryName(props.selectedCategory.name).name
  );

  return (
    /* Top Section - Main Display Area */
    <>
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
        {props.isGroupExpense && (
          <Box
            sx={{
              position: "absolute",
              top: 32,
              right: 24,
              zIndex: 100,
            }}
          >
            <SplitInfoTooltip
              expense={props.expense as Expense}
              currentAmount={props.currentAmount}
              isEditMode={false}
            />
          </Box>
        )}

        {/* Category Selector Chip*/}
        <Chip
          label={props.selectedCategory?.name || "Select Category"}
          sx={{
            backgroundColor: isDark ? alpha(categoryColor, 0.4) : categoryColor,
            color: props.selectedCategory?.name ? "white" : colors.text,
            fontSize: "0.8rem",
            fontWeight: 500,
            borderRadius: 2,
            padding: "2px 4px",
            height: "auto",
            textTransform: "none",
            cursor: "pointer",
            width: "fit-content",
            "&:hover": {
              backgroundColor: alpha(categoryColor, 0.5),
              color: props.selectedCategory?.name ? "white" : colors.text,
            },
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
              {props.currentAmount}
            </Typography>
          </Box>

          {/* Backspace Button positioned further to the right */}
          <IconButton
            onClick={props.handleBackspace}
            disabled={props.isCustomSplit}
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
          value={props.description}
          onChange={(e) =>
            props.handleFormValues(e.target.value, FormValues.DESCRIPTION)
          }
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
                borderBottom: `1px solid ${alpha(colors.textSecondary, 0.3)}`,
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
      {/* Category Picker Bottom Sheet */}
      <BottomSheet
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Categories"
      >
        <CategoryPicker
          open={showCategoryPicker}
          categories={props.filteredCategories}
          onClose={() => setShowCategoryPicker(false)}
          selectedCategory={props.selectedCategory.name}
          onCategorySelect={handleCategorySelect}
        />
      </BottomSheet>
    </>
  );
};

export default EntryDetail;
