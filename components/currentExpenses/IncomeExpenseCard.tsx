import { Box, Tooltip, Typography } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { InfoOutlineRounded } from "@mui/icons-material";

interface IncomeExpenseCardProps {
  amount: number;
  type: "income" | "expense";
}

const IncomeExpenseCard = ({ amount, type }: IncomeExpenseCardProps) => {
  const { colors } = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        flexDirection: { xs: "column", sm: "row" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "1.4rem",
            lineHeight: "1.25rem",
            color: {
              xs: type === "income" ? colors.income : colors.expense,
              sm: colors.text,
            },
            order: { xs: 2, sm: 1 },
          }}
        >
          $
          {amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            mb: 1,
          }}
        >
          <Typography
            sx={{
              color: colors.textSecondary,
              fontWeight: 550,
              fontSize: "0.8rem",
              lineHeight: "1rem",
            }}
          >
            {type === "income" ? "Income" : "Expense"}
          </Typography>
          {type === "expense" && (
            <Tooltip
              title="This is your total expenses for the current month."
              arrow
              placement="right"
            >
              <InfoOutlineRounded
                fontSize="small"
                sx={{
                  color: colors.textSecondary,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default IncomeExpenseCard;
