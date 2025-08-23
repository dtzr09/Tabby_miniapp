import React, { useState, useEffect } from "react";
import { Box, Button } from "@mui/material";
import { ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Category } from "../../utils/types";

interface CategoryPickerProps {
  open: boolean;
  onClose: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  categories: Category[];
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
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

  // Generate consistent colors for categories
  const getCategoryColor = (categoryName: string) => {
    const colorPalette = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FECA57",
      "#FF9FF3",
      "#54A0FF",
      "#5F27CD",
      "#00D2D3",
      "#FF9F43",
      "#A55EEA",
      "#26DE81",
      "#FD79A8",
      "#FDCB6E",
      "#6C5CE7",
    ];
    // Use category name to generate consistent color index
    const hash = categoryName.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

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

      // Lower threshold for more responsive swipe detection
      if (deltaX > 5 && deltaX > deltaY) {
        setIsDragging(true);
        e.preventDefault(); // Prevent scrolling while swiping
      }
    } else {
      e.preventDefault(); // Continue preventing scrolling during swipe
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const minSwipeDistance = 30; // Reduced for more responsive swiping

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
    <Box
      sx={{
        height: "18rem", // Reduced height
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Fixed height category grid container */}
      <Box
        sx={{
          height: "12rem", // Increased height for category section
          display: "flex",
          alignItems: totalPages > 1 ? "center" : "flex-start", // Top align when single page
          justifyContent: totalPages > 1 ? "center" : "flex-start", // Left align when single page
          pt: totalPages > 1 ? 0 : 2, // Add top padding when single page
          pl: totalPages > 1 ? 0 : 0.5, // Add left padding when single page to match grid padding
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2, // More compact spacing
            px: 0.5, // Reduced side padding
            touchAction: "pan-y", // Allow vertical scrolling but handle horizontal swipes
            transition: "all 0.3s ease-out", // Smooth transitions for page changes
            opacity: isDragging ? 0.8 : 1, // Visual feedback during swipe
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {categories
            .slice(categoryPage * 4, (categoryPage + 1) * 4)
            .map((cat: Category) => {
              const categoryColor = getCategoryColor(cat.name);
              return (
                <Button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0,
                    p: 2,
                    backgroundColor: categoryColor,
                    borderRadius: 3,
                    minHeight: "3.5rem", // Reduced button height
                    textTransform: "none",
                    color: "white",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    border: "none",
                    boxShadow: `0 2px 8px ${categoryColor}40`, // Shadow with category color
                    "&:hover": {
                      transform: "scale(1.05)", // Simple scale on hover
                      boxShadow: `0 4px 12px ${categoryColor}60`,
                    },
                    "&:active": {
                      transform: "scale(0.95)", // Press down effect
                    },
                  }}
                >
                  <Box
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: 1.3,
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)", // Better text readability
                    }}
                  >
                    {cat.name}
                  </Box>
                </Button>
              );
            })}
        </Box>
      </Box>

      {/* Navigation fixed at bottom */}
      {totalPages > 1 && (
        <Box
          sx={{
            height: "7rem", // Increased height for navigation
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center", // Center align all navigation elements
            pt: 0, // Remove top padding to bring closer
            transform: "translateY(-3rem)", // Move entire navigation higher up
          }}
        >
          <Button
            onClick={() => navigateCategories("prev")}
            disabled={categoryPage === 0}
            sx={{
              color: categoryPage === 0 ? colors.textSecondary : colors.text,
              minWidth: "auto",
              borderRadius: 2,
              transition: "all 0.2s ease-in-out",
              "&:disabled": {
                opacity: 0.3,
              },
            }}
          >
            <ChevronLeftOutlined />
          </Button>

          {/* Page Indicators */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: index === categoryPage ? 12 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    index === categoryPage
                      ? colors.text
                      : colors.textSecondary + "30",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // Smooth size transition
                }}
              />
            ))}
          </Box>

          <Button
            onClick={() => navigateCategories("next")}
            disabled={categoryPage === totalPages - 1}
            sx={{
              color:
                categoryPage === totalPages - 1
                  ? colors.textSecondary
                  : colors.text,
              minWidth: "auto",
              borderRadius: 2,
              transition: "all 0.2s ease-in-out",
              "&:disabled": {
                opacity: 0.3,
              },
            }}
          >
            <ChevronRightOutlined />
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CategoryPicker;
