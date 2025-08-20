import { Box, Button } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface GroupPersonalToggleProps {
  isGroup: boolean;
  onToggle: (isGroup: boolean) => void;
}

export default function GroupPersonalToggle({
  isGroup,
  onToggle,
}: GroupPersonalToggleProps) {
  const { colors } = useTheme();

  const buttonStyle = {
    flex: 1,
    px: 1.5,
    py: 0.5,
    borderRadius: 3,
    textTransform: "none" as const,
    fontWeight: 500,
    fontSize: "0.8rem",
    lineHeight: "1rem",
    transition: "all 0.2s ease-in-out",
    position: "relative" as const,
    zIndex: 2,
  };

  const activeStyle = {
    color: colors.text,
  };

  const inactiveStyle = {
    color: colors.textSecondary,
  };

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: colors.card,
        p: 0.5,
        borderRadius: 3,
        border: `1px solid ${colors.border}`,
        gap: 0.2,
        width: "100%",
        position: "relative",
      }}
    >
      {/* Sliding background indicator */}
      <Box
        sx={{
          position: "absolute",
          top: 2,
          left: 2,
          width: "calc(50% - 2px)",
          height: "calc(100% - 4px)",
          bgcolor: colors.incomeExpenseCard,
          borderRadius: 2.5,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isGroup ? "translateX(0)" : "translateX(100%)",
          zIndex: 1,
        }}
      />

      <Button
        disableRipple
        onClick={() => {
          if (!isGroup) {
            onToggle(true);
          }
        }}
        sx={{ ...buttonStyle, ...(isGroup ? activeStyle : inactiveStyle) }}
      >
        Group
      </Button>
      <Button
        disableRipple
        onClick={() => {
          if (isGroup) {
            onToggle(false);
          }
        }}
        sx={{ ...buttonStyle, ...(!isGroup ? activeStyle : inactiveStyle) }}
      >
        Me
      </Button>
    </Box>
  );
}
