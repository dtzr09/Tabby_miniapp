import { Box, Card, Typography } from "@mui/material";
import React from "react";
import { useTheme } from "../../src/contexts/ThemeContext";

interface BudgetOverviewCardProps {
  data: {
    totalExpenses: number;
    dateRange: string;
    dailyExpenses: { day: string; amount: number }[];
    categories: {
      id: string;
      name: string;
      icon: React.JSX.Element;
      budget: number;
      spent: number;
      color: string;
    }[];
  };
}
const BudgetOverviewCard = (props: BudgetOverviewCardProps) => {
  const { colors } = useTheme();
  return (
    <Card
      sx={{
        px: 2,
        py: 2,
        borderRadius: 4,
        bgcolor: colors.card,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1.2rem",
              color: colors.text,
            }}
          >
            Budget
          </Typography>
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: colors.textSecondary,
            }}
          >
            {props.data.categories.length} in total
          </Typography>
        </Box>
      </Box>

      {props.data.categories.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 4,
            color: colors.textSecondary,
          }}
        >
          <Typography variant="body2">
            No budgets or expenses found. Add some expenses to see your budget
            overview!
          </Typography>
        </Box>
      )}

      {/* Budget Categories */}
      {props.data.categories.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: "scroll",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {props.data.categories.map((category) => {
            if (category.budget === 0 || category.spent === undefined) {
              return null;
            }
            const progress = (category.spent / category.budget) * 100;

            return (
              <Box
                key={category.id}
                sx={{
                  minWidth: 120,
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: colors.surface,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: `conic-gradient(${category.color} ${
                      progress * 3.6
                    }deg, ${colors.surface} 0deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 45,
                      height: 45,
                      borderRadius: "50%",
                      backgroundColor: colors.card,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box sx={{ color: category.color, fontSize: 20 }}>
                      {category.icon}
                    </Box>
                  </Box>
                </Box>

                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  ${category.spent}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: colors.textSecondary,
                    textAlign: "center",
                    opacity: 0.7,
                    mb: 1,
                  }}
                >
                  {`of $${category.budget}`}
                </Typography>

                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  {category.name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
};

export default BudgetOverviewCard;
