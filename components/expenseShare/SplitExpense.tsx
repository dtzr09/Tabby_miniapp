import { Avatar, Box, Divider, TextField, Typography } from "@mui/material";
import { Expense, ExpenseShare } from "../../utils/types";
import { useTheme } from "@/contexts/ThemeContext";
import { stringToColor } from "../../utils/stringToColor";

interface SplitExpenseProps {
  expense: Expense;
  editExpenseShare: boolean;
}

const SplitExpense = ({ expense, editExpenseShare }: SplitExpenseProps) => {
  const { colors } = useTheme();
  const amountPerPerson = expense.shares?.length
    ? expense.amount / expense.shares?.length
    : expense.amount;

  const UserShare = ({ share }: { share: ExpenseShare }) => {
    return (
      <Box
        key={share.user_id}
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${colors.border}`,
          "&:last-child": {
            borderBottom: "none",
          },
          py: 1,
        }}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: stringToColor(share?.name || ""),
            }}
          />
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography variant="body2" color={colors.text}>
              {share.name}
            </Typography>
            <Typography variant="caption" color={colors.textSecondary}>
              @{share.username}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {editExpenseShare ? (
            <TextField
              value={share.share_amount.toFixed(2)}
              onChange={(e) => {
                share.share_amount = parseFloat(e.target.value);
              }}
              sx={{
                width: "70%",
                "& .MuiInputBase-input": {
                  textAlign: "right",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  letterSpacing: 1,
                  px: 0.75,
                  py: 0.5,
                  borderRadius: 3,
                  border: "none",
                  color: colors.text,
                  backgroundColor: colors.border,
                },
              }}
            />
          ) : (
            <Typography variant="body2" color={colors.text}>
              ${share.share_amount.toFixed(2)}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Divider sx={{ width: "100%", my: 1, borderColor: colors.border }} />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" color={colors.text}>
          ${amountPerPerson.toFixed(2)}
        </Typography>
        <Typography variant="body2" color={colors.textSecondary}>
          per people
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
        {expense.shares?.map((share) => (
          <UserShare key={share.user_id} share={share} />
        ))}
      </Box>
    </Box>
  );
};

export default SplitExpense;
