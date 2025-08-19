import { Box } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { alpha } from "@mui/material/styles";
import { FilterType } from "../../../utils/advancedFilterUtils";
import { UnifiedEntry } from "../../../utils/types";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

interface FilterViewsProps {
  filterType: FilterType;
  entries: UnifiedEntry[];
  selectedCategory?: string;
  onCategorySelect: (category: string) => void;
  selectedType: "expense" | "income";
  onTypeSelect: (type: "expense" | "income") => void;
}

interface CategoryInfo {
  name: string;
  isIncome: boolean;
}

export default function FilterViews({
  filterType,
  entries,
  selectedCategory,
  onCategorySelect,
  selectedType,
  onTypeSelect,
}: FilterViewsProps) {
  const { colors } = useTheme();

  if (filterType === "category") {
    // Get unique categories with their income/expense status
    const categoriesMap = new Map<string, CategoryInfo>();
    entries.forEach((entry) => {
      if (entry.category) {
        categoriesMap.set(entry.category, {
          name: entry.category,
          isIncome: entry.isIncome,
        });
      }
    });
    const categories = Array.from(categoriesMap.values());

    return (
      <Box sx={{ mt: 1 }}>
        <Box
          sx={{
            display: "flex",
            overflowX: "auto",
            gap: 1,
            pb: 1,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
            "&": {
              msOverflowStyle: "none",
            },
            "-webkit-overflow-scrolling": "touch",
          }}
        >
          {selectedType === "expense" ? (
            <Box
              onClick={() => onTypeSelect("income")}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 0.8,
                borderRadius: 2,
                cursor: "pointer",
                minWidth: 32,
                bgcolor: alpha(colors.expense, 0.1),
                color: colors.expense,
                transition: "all 0.2s ease-in-out",
              }}
            >
              <RemoveIcon sx={{ fontSize: "1rem" }} />
            </Box>
          ) : (
            <Box
              onClick={() => onTypeSelect("expense")}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 0.8,
                borderRadius: 2,
                cursor: "pointer",
                minWidth: 32,
                bgcolor: alpha(colors.income, 0.1),
                color: colors.income,
                transition: "all 0.2s ease-in-out",
              }}
            >
              <AddIcon sx={{ fontSize: "1rem" }} />
            </Box>
          )}
          {categories
            .filter((cat) => cat.isIncome === (selectedType === "income"))
            .map(({ name }) => (
              <Box
                key={name}
                onClick={() => onCategorySelect(name)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 2,
                  fontSize: "0.75rem",
                  fontWeight: selectedCategory === name ? 600 : 500,
                  color:
                    selectedCategory === name ? colors.primary : colors.text,
                  bgcolor:
                    selectedCategory === name
                      ? alpha(colors.primary, 0.1)
                      : colors.incomeExpenseCard,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {name}
              </Box>
            ))}
        </Box>
      </Box>
    );
  }

  if (filterType === "type") {
    return (
      <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
        <Box
          sx={{
            display: "flex",
            bgcolor: colors.incomeExpenseCard,
            p: 0.2,
            borderRadius: 2.5,
            gap: 0.2,
          }}
        >
          <Box
            onClick={() => onTypeSelect("expense")}
            sx={{
              px: 1.8,
              py: 0.5,
              borderRadius: 2,
              fontSize: "0.75rem",
              fontWeight: 500,
              color:
                selectedType === "expense" ? colors.text : colors.textSecondary,
              bgcolor: selectedType === "expense" ? colors.card : "transparent",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
            }}
          >
            Expense
          </Box>
          <Box
            onClick={() => onTypeSelect("income")}
            sx={{
              px: 1.8,
              py: 0.5,
              borderRadius: 2,
              fontSize: "0.75rem",
              fontWeight: 500,
              color:
                selectedType === "income" ? colors.text : colors.textSecondary,
              bgcolor: selectedType === "income" ? colors.card : "transparent",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
            }}
          >
            Income
          </Box>
        </Box>
      </Box>
    );
  }

  return null;
}
