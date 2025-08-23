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
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startX);
      const deltaY = Math.abs(touch.clientY - startY);
      
      // Only consider it a swipe if horizontal movement is greater than vertical
      if (deltaX > 10 && deltaX > deltaY) {
        setIsDragging(true);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous page
        navigateCategories("prev");
      } else {
        // Swipe left - go to next page
        navigateCategories("next");
      }
    }
    
    setIsDragging(false);
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
            touchAction: "pan-y", // Allow vertical scrolling but handle horizontal swipes
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
