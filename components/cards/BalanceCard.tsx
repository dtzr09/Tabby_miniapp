import { Card, CardContent, Typography, Box, alpha } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";

interface BalanceCardProps {
  availableBalance?: number;
  daysRemaining?: number;
  dailyBudget?: number;
  spentAmount?: number;
  totalBudget?: number;
}

export default function BalanceCard({
  availableBalance = 689.21,
  daysRemaining = 24,
  dailyBudget = 34.78,
  spentAmount = 510.79,
  totalBudget = 1200,
}: BalanceCardProps) {
  const { colors } = useTheme();

  // Check if there's a budget set
  const hasBudget = totalBudget > 0;
  const remainingBudget = totalBudget - spentAmount;

  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: colors.card,
        boxShadow: 0,
        border: `1px solid ${colors.border}`,
      }}
    >
      <CardContent sx={{ px: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: colors.textSecondary,
              fontWeight: 500,
            }}
          >
            Remaining Balance
          </Typography>
        </Box>

        {/* Main Balance */}
        <Box sx={{ mb: hasBudget ? 2 : 0 }}>
          <Typography
            sx={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1,
              display: "flex",
              alignItems: "baseline",
            }}
          >
            {(() => {
              const balanceStr = availableBalance.toFixed(2);
              const [dollars, cents] = balanceStr.split(".");
              return (
                <>
                  <span>${dollars}</span>
                  <span
                    style={{
                      fontSize: "1.5rem",
                      color: colors.textSecondary,
                      marginLeft: "2px",
                    }}
                  >
                    .{cents}
                  </span>
                </>
              );
            })()}
          </Typography>
        </Box>

        {/* Budget Info Box - Only show if there's a budget */}
        {hasBudget && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: colors.textSecondary,
                lineHeight: 1.3,
              }}
            >
              {daysRemaining} more days -{" "}
              <span style={{ fontWeight: 700, color: alpha(colors.text, 0.7) }}>
                ${dailyBudget.toFixed(2)} per day
              </span>
              .
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
