import { Avatar, Box, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useTheme } from "../../src/contexts/ThemeContext";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

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
      <Avatar
        sx={{
          width: 40,
          height: 40,
          backgroundColor:
            type === "income" ? colors.incomeBg : colors.expenseBg,
          display: { xs: "none", sm: "flex" },
        }}
      >
        {type === "income" ? (
          <TrendingUpIcon sx={{ color: colors.income, fontSize: 20 }} />
        ) : (
          <TrendingDownIcon sx={{ color: colors.expense, fontSize: 20 }} />
        )}
      </Avatar>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          textAlign: { xs: "center", sm: "left" },
          order: { xs: type === "income" ? 2 : 1, sm: 1 },
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
        <Typography
          sx={{
            color: colors.textSecondary,
            fontWeight: 550,
            fontSize: "0.8rem",
            lineHeight: "1rem",
            mb: {
              xs: 0.5,
            },
            order: { xs: 1, sm: 2 },
          }}
        >
          {type === "income" ? "Income" : "Expense"}
        </Typography>
      </Box>
    </Box>
  );
};

export default IncomeExpenseCard;
