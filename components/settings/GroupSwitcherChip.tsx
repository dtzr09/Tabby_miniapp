import { useTheme } from "@/contexts/ThemeContext";
import { Box, Chip, Menu, MenuItem } from "@mui/material";
import { Group } from "../../utils/types";
import { useCallback, useState } from "react";
import { TelegramUser } from "../dashboard";

interface GroupSwitcherChipProps {
  chat_id: string | null;
  user: TelegramUser | null;
  availableGroups: Group[];
  groupName: string | null;
  setChatId: (chatId: string | null) => void;
}
const GroupSwitcherChip = ({
  chat_id,
  user,
  availableGroups,
  groupName,
  setChatId,
}: GroupSwitcherChipProps) => {
  const { colors } = useTheme();
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const handleGroupMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setGroupMenuAnchor(event.currentTarget);
    },
    []
  );

  const handleGroupMenuClose = useCallback(() => {
    setGroupMenuAnchor(null);
  }, []);

  const handleGroupSelect = useCallback(
    (groupId: string | null) => {
      setChatId(groupId);
      handleGroupMenuClose();
    },
    [setChatId, handleGroupMenuClose]
  );

  // Early return after all hooks are called
  if (availableGroups.length === 0) return null;

  // Get the current group name
  const currentGroupName =
    chat_id && chat_id !== user?.id?.toString()
      ? groupName ||
        availableGroups.find((g: Group) => g.chat_id === chat_id)
          ?.name ||
        availableGroups.find((g: Group) => g.chat_id === chat_id)
          ?.title ||
        "Group"
      : "Personal";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Chip
        label={currentGroupName}
        onClick={handleGroupMenuOpen}
        sx={{
          color: colors.text,
          border: `1px solid ${colors.border}`,
          fontSize: "0.75rem",
          height: "28px",
        }}
        clickable
      />
      <Menu
        anchorEl={groupMenuAnchor}
        open={Boolean(groupMenuAnchor)}
        onClose={handleGroupMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: colors.card,
              borderColor: colors.border,
              boxShadow: `0 2px 4px -1px ${colors.border}`,
              borderRadius: 3,
              minWidth: 100,
              mt: 0.5,
              py: 0.25,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => handleGroupSelect(user?.id?.toString() || null)}
          selected={
            !chat_id || chat_id === user?.id?.toString()
          }
          sx={{
            color: colors.text,
            fontSize: "0.75rem",
            py: 0.5,
            px: 1,
            minHeight: "auto",
            borderRadius: 2,
            mx: 0.5,
            "&.Mui-selected": {
              bgcolor: colors.incomeExpenseCard,
              color: colors.text,
              "&:hover": {
                bgcolor: colors.incomeExpenseCard,
              },
            },
            "&:hover": {
              bgcolor: colors.surface,
            },
          }}
        >
          Personal
        </MenuItem>
        {availableGroups.map((group: Group) => (
          <MenuItem
            key={group.chat_id}
            onClick={() => handleGroupSelect(group.chat_id)}
            selected={chat_id === group.chat_id}
            sx={{
              color: colors.text,
              fontSize: "0.75rem",
              py: 0.5,
              px: 1,
              minHeight: "auto",
              borderRadius: 2,
              mx: 0.5,
              "&.Mui-selected": {
                bgcolor: colors.incomeExpenseCard,
                color: colors.text,
                "&:hover": {
                  bgcolor: colors.incomeExpenseCard,
                },
              },
              "&:hover": {
                bgcolor: colors.surface,
              },
            }}
          >
            {group.name || group.title}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default GroupSwitcherChip;
