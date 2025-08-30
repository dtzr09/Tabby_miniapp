import React from "react";
import { Menu, MenuItem, IconButton, Typography } from "@mui/material";
import { KeyboardArrowDown, Check as CheckIcon } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";

interface TimeRangeMenuProps {
  viewType: "Week" | "Month";
  onViewTypeChange: (type: "Week" | "Month") => void;
}

export default function TimeRangeMenu({
  viewType,
  onViewTypeChange,
}: TimeRangeMenuProps) {
  const { colors } = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (type: "Week" | "Month") => {
    onViewTypeChange(type);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: colors.text,
          p: 0,
          ml: 1,
          fontSize: "0.7rem",
          fontWeight: 500,
          textTransform: "none",
        }}
      >
        <Typography
          sx={{
            fontSize: "inherit",
            color: "inherit",
            fontWeight: 600,
            letterSpacing: ".015em",
          }}
        >
          {viewType}
        </Typography>
        <KeyboardArrowDown sx={{ fontSize: "0.9rem", ml: 0.2 }} />
      </IconButton>
      <Menu
        disableScrollLock
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            bgcolor: colors.card,
            borderRadius: 1.5,
            minWidth: 90,
            mt: 0.5,
            "& .MuiMenuItem-root": {
              fontSize: "0.7rem",
              minHeight: 28,
              py: 0.2,
              px: 1,
              color: colors.textSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 0.5,

              "&.selected": {
                color: colors.text,
                fontWeight: 600,
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => handleMenuItemClick("Week")}
          className={viewType === "Week" ? "selected" : ""}
        >
          Week
          {viewType === "Week" && (
            <CheckIcon sx={{ fontSize: "0.7rem", color: colors.text }} />
          )}
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuItemClick("Month")}
          className={viewType === "Month" ? "selected" : ""}
        >
          Month
          {viewType === "Month" && (
            <CheckIcon sx={{ fontSize: "0.7rem", color: colors.text }} />
          )}
        </MenuItem>
      </Menu>
    </>
  );
}
