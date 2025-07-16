import { Card, Box, Divider } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import IncomeExpenseCard from "./IncomeExpenseCard";

interface ExpenseSummaryCardProps {
  totalIncome: number;
  totalExpenses: number;
}

export default function ExpenseSummaryCard({
  totalIncome,
  totalExpenses,
}: ExpenseSummaryCardProps) {
  const { colors } = useTheme();

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 500,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Total Balance Card */}
      {/* <Card
        sx={{
          borderRadius: 4,
          bgcolor: colors.card,
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
            "&:last-child": {
              pb: 1,
            },
          }}
        >
          <Box>
            <Typography
              sx={{
                color: colors.textSecondary,
                fontWeight: 550,
                fontSize: "1rem",
                lineHeight: "1.5rem",
                mb: 0.5,
              }}
            >
              Total Balance
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1.8rem",
                lineHeight: "2rem",
                letterSpacing: "-.025em",
                color: colors.text,
              }}
            >
              $
              {totalBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Box>
          <Avatar
            sx={{ width: 45, height: 45, backgroundColor: colors.cardBg }}
          >
            <AccountBalanceWalletOutlinedIcon
              sx={{ color: colors.primary, fontSize: 25 }}
            />
          </Avatar>
        </CardContent>
      </Card> */}
      {/* Income & Expenses Cards */}
      <Box
        sx={{
          gap: 2,
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <Card
          sx={{
            px: 4,
            py: 2,
            borderRadius: 4,
            bgcolor: colors.card,
            flex: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              gap: 2,
            }}
          >
            <IncomeExpenseCard amount={totalIncome} type="income" />
            <Divider orientation="vertical" flexItem />
            <IncomeExpenseCard amount={totalExpenses} type="expense" />
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
