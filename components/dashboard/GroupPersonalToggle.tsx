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
    py: 1,
    borderRadius: 3,
    textTransform: "none" as const,
    fontWeight: 500,
    fontSize: "0.8rem",
    lineHeight: "1rem",
    transition: "all 0.2s ease-in-out",
  };

  const activeStyle = {
    bgcolor: colors.card,
    color: colors.text,
  };

  const inactiveStyle = {
    bgcolor: "transparent",
    color: colors.textSecondary,
  };

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: colors.card,
        p: 0.2,
        borderRadius: 3,
        border: `1px solid ${colors.border}`,
        gap: 0.2,
        width: "100%",
      }}
    >
      <Button
        onClick={() => !isGroup && onToggle(true)}
        sx={{ ...buttonStyle, ...(isGroup ? activeStyle : inactiveStyle) }}
      >
        Group
      </Button>
      <Button
        onClick={() => isGroup && onToggle(false)}
        sx={{ ...buttonStyle, ...(!isGroup ? activeStyle : inactiveStyle) }}
      >
        Me
      </Button>
    </Box>
  );
}
