import {
  Card,
  CardContent,
  Typography,
  Box,
  alpha,
  LinearProgress,
} from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";

interface BalanceCardProps {
  availableBalance: number;
  totalBudget: number;
}

// Determine progress bar color based on usage percentage
export const getProgressColor = (percentage: number) => {
  if (percentage < 25) return "#4CAF50"; // Green
  if (percentage < 50) return "#FFC107"; // Yellow
  if (percentage < 75) return "#FF9800"; // Orange
  return "#F44336"; // Red
};

export default function BalanceCard({
  availableBalance,
  totalBudget,
}: BalanceCardProps) {
  const { colors } = useTheme();

  const daysRemaining =
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() -
    new Date().getDate();

  // Check if there's a budget set
  const hasBudget = totalBudget > 0;

  // Calculate budget usage percentage
  const budgetUsed = totalBudget - availableBalance;
  const usagePercentage =
    totalBudget > 0 ? (budgetUsed / totalBudget) * 100 : 0;
  const dailyBudget = availableBalance / daysRemaining;

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
        <Box sx={{ mb: hasBudget && daysRemaining > 0 ? 2 : 0 }}>
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
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: colors.textSecondary,
                      marginLeft: "8px",
                    }}
                  >
                    of ${totalBudget.toFixed(2)}
                  </span>
                </>
              );
            })()}
          </Typography>
        </Box>

        {/* Budget Info Box - Only show if there's a budget */}
        {hasBudget && daysRemaining > 0 && (
          <>
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
                  fontSize: "0.85rem",
                  color: colors.textSecondary,
                  lineHeight: 1.3,
                }}
              >
                {daysRemaining} more days
                {dailyBudget > 0 && (
                  <span
                    style={{ fontWeight: 700, color: alpha(colors.text, 0.7) }}
                  >
                    {""} - ${dailyBudget.toFixed(2)} per day
                  </span>
                )}
              </Typography>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(usagePercentage, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha(colors.text, 0.1),
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: getProgressColor(usagePercentage),
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            {/* Percentage Labels */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: colors.textSecondary,
                  fontWeight: 500,
                }}
              >
                0%
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: colors.textSecondary,
                  fontWeight: 500,
                }}
              >
                25%
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: colors.textSecondary,
                  fontWeight: 500,
                }}
              >
                50%
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: colors.textSecondary,
                  fontWeight: 500,
                }}
              >
                75%
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: colors.textSecondary,
                  fontWeight: 500,
                }}
              >
                100%
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
