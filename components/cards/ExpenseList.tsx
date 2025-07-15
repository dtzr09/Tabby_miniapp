import {
  List,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Button,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const TELEGRAM_ACCENT = "#eaf1ff";
const ENTRY_BG = "#f8fafc";
const INCOME_ICON_BG = "#bbf7d0";
const EXPENSE_ICON_BG = "#fecaca";
const TELEGRAM_BLUE = "#3390ec";

const transactions = [
  {
    description: "Lunch at cafe",
    category: "Food",
    date: "Jul 14",
    amount: -25.5,
    isIncome: false,
  },
  {
    description: "Salary",
    category: "Income",
    date: "Jul 14",
    amount: 1500.0,
    isIncome: true,
  },
  {
    description: "Uber ride",
    category: "Transport",
    date: "Jul 13",
    amount: -45.0,
    isIncome: false,
  },
  {
    description: "Groceries",
    category: "Shopping",
    date: "Jul 13",
    amount: -120.0,
    isIncome: false,
  },
];

export default function ExpenseList() {
  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: 0,
        bgcolor: "#fff",
        color: "#222",
        border: "1.5px solid #dde6f2",
        p: 2,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3, ml: 1 }}>
          <Avatar
            sx={{
              bgcolor: TELEGRAM_ACCENT,
              color: "#2563eb",
              width: 32,
              height: 32,
              mr: 1,
            }}
          >
            <AccessTimeIcon />
          </Avatar>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#111827", fontSize: 28 }}
          >
            Recent Transactions
          </Typography>
        </Box>
        <List sx={{ width: "100%", p: 0 }}>
          {transactions.map((tx, idx) => {
            const isIncome = tx.isIncome;
            return (
              <Box
                key={idx}
                sx={{
                  bgcolor: ENTRY_BG,
                  borderRadius: 3,
                  mb: 2.5,
                  px: 2,
                  py: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    sx={{
                      bgcolor: isIncome ? INCOME_ICON_BG : EXPENSE_ICON_BG,
                      color: isIncome ? "#22c55e" : "#ef4444",
                      width: 44,
                      height: 44,
                      mr: 2.5,
                    }}
                  >
                    {isIncome ? (
                      <TrendingUpIcon sx={{ fontSize: 28 }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 28 }} />
                    )}
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{ fontWeight: 700, fontSize: 20, color: "#222" }}
                    >
                      {tx.description}
                    </Typography>
                    <Typography
                      sx={{ color: "#6b7280", fontSize: 16, fontWeight: 500 }}
                    >
                      {tx.category} b7 {tx.date}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: isIncome ? "#22c55e" : "#ef4444",
                    fontSize: 22,
                  }}
                >
                  {isIncome ? "+" : "-"}
                  {Math.abs(tx.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            );
          })}
        </List>
        <Button
          variant="contained"
          href="/advanced-search"
          sx={{
            mt: 3,
            width: "100%",
            bgcolor: TELEGRAM_BLUE,
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
            borderRadius: 2,
            textTransform: "none",
            boxShadow: 0,
            py: 1.5,
            '&:hover': { bgcolor: '#2776c5' },
          }}
        >
          Advanced Search
        </Button>
      </CardContent>
    </Card>
  );
}
