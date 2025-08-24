import { useCallback } from "react";
import { Box, Typography, TextField, Avatar } from "@mui/material";
import { stringToColor } from "../../utils/stringToColor";
import { ExpenseShare } from "../../utils/types";
import { useTheme } from "@/contexts/ThemeContext";

interface UserShareProps {
  share: ExpenseShare;
  inputValue: string;
  hasError: string | undefined;
  editExpenseShare: boolean;
  amountPerPerson: number;
  onInputChange: (userId: string | number, value: string) => void;
  onInputBlur: (userId: string | number) => void;
}

const UserShare = ({
  share,
  inputValue,
  hasError,
  editExpenseShare,
  amountPerPerson,
  onInputChange,
  onInputBlur,
}: UserShareProps) => {
  const { colors } = useTheme();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange(share.user_id, e.target.value);
    },
    [share.user_id, onInputChange]
  );

  const handleBlur = useCallback(() => {
    onInputBlur(share.user_id);
  }, [share.user_id, onInputBlur]);

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
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              width: "100%",
            }}
          >
            <TextField
              value={inputValue}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!hasError}
              sx={{
                width: "100%",
                "& .MuiInputBase-root": {
                  backgroundColor: colors.border,
                  borderRadius: 3,
                  border: "none",
                  "& fieldset": {
                    border: "none",
                  },
                  "&:hover fieldset": {
                    border: "none",
                  },
                  "&.Mui-focused fieldset": {
                    border: "none",
                  },
                },
                "& .MuiInputBase-input": {
                  textAlign: "right",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  letterSpacing: 1,
                  px: 0.75,
                  py: 0.5,
                  color: colors.text,
                },
              }}
            />
            {hasError && (
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  color: "#d32f2f",
                  mt: 0.25,
                  textAlign: "right",
                }}
              >
                {hasError}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color={colors.text}>
            ${amountPerPerson.toFixed(2)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default UserShare;
