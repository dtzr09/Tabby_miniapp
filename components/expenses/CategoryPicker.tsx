import React from "react";
import { Box, Button, Typography, List, ListItem } from "@mui/material";
import { Check } from "@mui/icons-material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Category } from "../../utils/types";
import { cleanCategoryName } from "../../utils/categoryUtils";

interface CategoryPickerProps {
  open: boolean;
  onClose: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  categories: Category[];
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  onClose,
  selectedCategory,
  onCategorySelect,
  categories,
}) => {
  const { colors } = useTheme();

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

  const handleCategorySelect = (categoryName: string) => {
    onCategorySelect(categoryName);
    onClose();
  };

  return (
    <Box
      sx={{
        maxHeight: "28rem",
        display: "flex",
        flexDirection: "column",
        py: 1,
      }}
    >
      {/* Scrollable category list */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: colors.textSecondary + "40",
            borderRadius: "2px",
          },
        }}
      >
        <List sx={{ padding: 0 }}>
          {categories.map((cat: Category) => {
            const cleanedCategory = cleanCategoryName(cat.name);
            const categoryColor = getCategoryColor(cleanedCategory.name);
            const isSelected = selectedCategory === cleanedCategory.name;

            return (
              <ListItem key={cat.name} sx={{ padding: 0, mb: 0.5 }}>
                <Button
                  onClick={() => handleCategorySelect(cat.name)}
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 1.5,
                    p: 1,
                    backgroundColor: isSelected
                      ? colors.surface
                      : "transparent",
                    borderRadius: 2,
                    textTransform: "none",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      backgroundColor: colors.surface,
                    },
                    "&:active": {
                      transform: "scale(0.98)",
                    },
                  }}
                >
                  {/* Category icon circle */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: categoryColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "1.25rem",
                    }}
                  >
                    {cleanedCategory.emoji}
                  </Box>

                  {/* Category name */}
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      color: colors.text,
                      textAlign: "left",
                      flex: 1,
                    }}
                  >
                    {cleanedCategory.name}
                  </Typography>

                  {/* Selected indicator */}
                  {isSelected && (
                    <Check
                      sx={{
                        color: colors.text,
                        fontSize: "1.2rem",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Button>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default CategoryPicker;
