import { Button } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { PersonOutlineOutlined, WorkspacesOutlined } from "@mui/icons-material";

interface GroupPersonalToggleProps {
  isGroup: boolean;
  onToggle: () => void;
}

export default function GroupPersonalToggle({
  isGroup,
  onToggle,
}: GroupPersonalToggleProps) {
  const { colors } = useTheme();

  return (
    <Button
      onClick={onToggle}
      variant="outlined"
      sx={{
        borderRadius: 3,
        border: `1px solid ${colors.border}`,
        textTransform: "none",
        fontWeight: 500,
        fontSize: "0.8rem",
        py: 0.75,
        px: 1.5,
        color: colors.text,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      {!isGroup ? (
        <>
          <WorkspacesOutlined sx={{ fontSize: "1rem" }} />
          Group
        </>
      ) : (
        <>
          <PersonOutlineOutlined sx={{ fontSize: "1rem" }} />
          Me
        </>
      )}
    </Button>
  );
}
