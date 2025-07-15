import { Card, CardContent, Typography, Box, Avatar } from "@mui/material";
import Grid from "@mui/material/Grid";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

export default function ExpenseSummaryCard() {
  // Placeholder values for now
  const total = 1309.5;
  const income = 1500.0;
  const expenses = 190.5;

  return (
    <Box sx={{ width: "100%", maxWidth: 500, mx: "auto", mb: 3 }}>
      {/* Total Balance Card */}
      <Card sx={{ borderRadius: 4, boxShadow: 0, bgcolor: "#fff", mb: 2 }}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 4,
          }}
        >
          <Box>
            <Typography
              sx={{ color: "#64748b", fontWeight: 600, fontSize: 20, mb: 1 }}
            >
              Total Balance
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 40, color: "#111827" }}
            >
              {total.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: "#eaf1ff", width: 64, height: 64 }}>
            <AccountBalanceWalletOutlinedIcon
              sx={{ color: "#2563eb", fontSize: 40 }}
            />
          </Avatar>
        </CardContent>
      </Card>
      {/* Income & Expenses Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 0, bgcolor: "#fff" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", p: 3 }}>
              <Avatar sx={{ bgcolor: "#e6f9ed", width: 48, height: 48, mr: 2 }}>
                <TrendingUpIcon sx={{ color: "#22c55e", fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography
                  sx={{ color: "#64748b", fontWeight: 600, fontSize: 16 }}
                >
                  Income
                </Typography>
                <Typography
                  sx={{ fontWeight: 700, fontSize: 24, color: "#22c55e" }}
                >
                  {income.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 0, bgcolor: "#fff" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", p: 3 }}>
              <Avatar sx={{ bgcolor: "#ffeaea", width: 48, height: 48, mr: 2 }}>
                <TrendingDownIcon sx={{ color: "#ef4444", fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography
                  sx={{ color: "#64748b", fontWeight: 600, fontSize: 16 }}
                >
                  Expenses
                </Typography>
                <Typography
                  sx={{ fontWeight: 700, fontSize: 24, color: "#ef4444" }}
                >
                  {expenses.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
