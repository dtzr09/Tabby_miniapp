import React from "react";
import { Box, Button, Typography, List, ListItem, alpha } from "@mui/material";
import { Check } from "@mui/icons-material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Category } from "../../utils/types";
import { cleanCategoryName } from "../../utils/categoryUtils";
import { getCategoryColor } from "../../utils/categoryColors";

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
  const { colors, isDark } = useTheme();

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
            const categoryColor = getCategoryColor(cleanedCategory.name, isDark);
            const cleanedSelectedCategory = cleanCategoryName(selectedCategory);
            const isSelected =
              cleanedSelectedCategory.name === cleanedCategory.name;

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
                      backgroundColor: isDark ? alpha(categoryColor, 0.4) : categoryColor,
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
