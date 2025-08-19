import {
  KeyboardArrowDownRounded,
  PersonOutlineOutlined,
} from "@mui/icons-material";
import { Box, Button, Menu, MenuItem, Typography } from "@mui/material";
import React, { useState } from "react";
import { useTheme } from "../../src/contexts/ThemeContext";

export interface GroupSwitcherProps {
  groups?: Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
  }>;
  selectedGroupId?: string | null;
  setSelectedGroupId?: (groupId: string | null) => void;
}

const GroupSwitcher = (props: GroupSwitcherProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { colors } = useTheme();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGroupSelect = (groupId: string | null) => {
    if (props.setSelectedGroupId) {
      props.setSelectedGroupId(groupId);
    }
    handleClose();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Button
        fullWidth
        variant="outlined"
        onClick={handleClick}
        sx={{
          borderRadius: 3,
          border: `1px solid ${colors.border}`,
          textTransform: "none",
          display: "flex",
          alignItems: "center",
          gap: 0.3,
          py: 1,
          color: colors.text,
          backgroundColor: colors.incomeExpenseCard,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
            }}
          >
            {props.groups?.find((group) => group.id === props.selectedGroupId)
              ?.icon || <PersonOutlineOutlined sx={{ fontSize: "1.2rem" }} />}
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              fontSize: "0.8rem",
              lineHeight: "1rem",
              textAlign: "left",
              flex: 1,
            }}
          >
            {props.groups?.find((group) => group.id === props.selectedGroupId)
              ?.name || "Personal"}
          </Typography>
        </Box>
        <KeyboardArrowDownRounded
          sx={{
            color: colors.textSecondary,
            width: 14,
            height: 14,
            fontSize: "1rem",
          }}
        />
      </Button>
      <Menu
        disableScrollLock
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              width: anchorEl?.offsetWidth,
              mt: 0.2,
              backgroundColor: colors.incomeExpenseCard,
              borderColor: colors.border,
              boxShadow: `0 2px 4px -1px ${colors.border}`,
              borderRadius: 2.5,
              px: 0.5,
              py: 0.1,
            },
          },
        }}
      >
        {props.groups?.map((group) => (
          <MenuItem
            key={group.id}
            onClick={() => handleGroupSelect(group.id)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 0.5,
              width: "100%",
              color: colors.text,
              backgroundColor:
                group.id === props.selectedGroupId ||
                (group.id === null && props.selectedGroupId === null)
                  ? colors.card
                  : "transparent",
              borderRadius: 3,
              py: 0.5,
              px: 1,
              fontSize: "0.8rem",
              fontWeight: 500,
              minHeight: "32px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                width: "20px",
                justifyContent: "center",
              }}
            >
              {group.icon}
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: "0.8rem",
                lineHeight: "1rem",
                flex: 1,
                textAlign: "left",
              }}
            >
              {group.name}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default GroupSwitcher;
