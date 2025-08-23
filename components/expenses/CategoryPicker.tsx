import React, { useState, useEffect } from "react";
import { Box, Button } from "@mui/material";
import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { useTheme } from "../../src/contexts/ThemeContext";
import BottomSheet from "../common/BottomSheet";
import { Category } from "../../utils/types";

interface CategoryPickerProps {
  open: boolean;
  onClose: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  categories: Category[];
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  open,
  onClose,
  // selectedCategory,
  onCategorySelect,
  categories,
}) => {
  const [categoryPage, setCategoryPage] = useState(0);
  const { colors } = useTheme();

  // Reset page when categories change
  useEffect(() => {
    setCategoryPage(0);
  }, [categories]);

  const handleCategorySelect = (categoryName: string) => {
    onCategorySelect(categoryName);
    onClose();
  };

  const totalPages = Math.ceil(categories.length / 4);

  const navigateCategories = (direction: "prev" | "next") => {
    if (direction === "prev" && categoryPage > 0) {
      setCategoryPage(categoryPage - 1);
    } else if (direction === "next" && categoryPage < totalPages - 1) {
      setCategoryPage(categoryPage + 1);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Select Category">
      <Box>
        {/* Category Grid (2x2) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            mb: 3,
          }}
        >
          {categories
            .slice(categoryPage * 4, (categoryPage + 1) * 4)
            .map((cat: Category) => (
              <Button
                key={cat.name}
                onClick={() => handleCategorySelect(cat.name)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  p: 2,
                  backgroundColor: colors.card,
                  borderRadius: 3,
                  minHeight: "5rem",
                  textTransform: "none",
                  color: colors.text,
                  // border:
                  //   selectedCategory === cat.name
                  //     ? `2px solid ${cat.id}`
                  //     : "2px solid transparent",
                  "&:hover": {
                    backgroundColor: colors.surface,
                  },
                }}
              >
                <span style={{ fontSize: "2rem" }}>{cat.emoji}</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                  {cat.name}
                </span>
              </Button>
            ))}
        </Box>

        {/* Navigation */}
        {totalPages > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              onClick={() => navigateCategories("prev")}
              disabled={categoryPage === 0}
              sx={{
                color: colors.text,
                minWidth: "auto",
                p: 1,
              }}
            >
              <ChevronLeftOutlined />
            </Button>

            {/* Page Indicators */}
            <Box sx={{ display: "flex", gap: 1 }}>
              {Array.from({ length: totalPages }).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor:
                      index === categoryPage
                        ? colors.text
                        : colors.textSecondary + "40",
                  }}
                />
              ))}
            </Box>

            <Button
              onClick={() => navigateCategories("next")}
              disabled={categoryPage === totalPages - 1}
              sx={{
                color: colors.text,
                minWidth: "auto",
                p: 1,
              }}
            >
              <ChevronRightOutlined />
            </Button>
          </Box>
        )}
      </Box>
    </BottomSheet>
  );
};

export default CategoryPicker;
