import { useTheme } from "@/contexts/ThemeContext";
import {
  CalendarMonth,
  Close,
  DeleteOutline,
  Group,
  MoreVert,
  RepeatOutlined,
} from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import React from "react";

interface DatetimeBarProps {
  onDelete?: () => void;
  onToggleRecurring?: () => void;
  isGroupExpense: boolean;
  isIncome: boolean;
  setShowDateTimePicker: (show: boolean) => void;
  selectedDateTime: Date;
  showFloatingPanel: boolean;
  setShowFloatingPanel: (show: boolean) => void;
  isCustomSplit: boolean;
  setEditExpenseShare: (edit: boolean) => void;
  setShowSplitExpenseSheet: (show: boolean) => void;
  bottomSectionBounds: { height: number };
}
const DatetimeBar = (props: DatetimeBarProps) => {
  const { colors } = useTheme();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Format time exactly like the screenshot: "11:43"
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        py: 0.5,
        gap: 1,
        position: "relative",
        zIndex: 1000,
      }}
    >
      {/* Date and Time */}
      <Button
        onClick={() => {
          props.setShowDateTimePicker(true);
          props.setShowFloatingPanel(false);
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          backgroundColor: colors.border,
          py: 1,
          borderRadius: 3,
          textTransform: "none",
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <CalendarMonth fontSize="small" sx={{ mr: 1, color: colors.text }} />
          <Typography
            sx={{
              color: colors.text,
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {formatDate(props.selectedDateTime.toISOString())}
          </Typography>
        </Box>

        <Typography
          sx={{
            color: colors.text,
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {formatTime(props.selectedDateTime.toISOString())}
        </Typography>
      </Button>

      {/* Floating Panel for Group Actions */}
      {props.isGroupExpense && props.showFloatingPanel && !props.isIncome && (
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: "fixed",
            right: "1rem",
            bottom: `${props.bottomSectionBounds.height + 28}px`, // Position just above the MoreVert icon
            backgroundColor: colors.surface,
            borderRadius: 3,
            boxShadow: `0 4px 20px ${colors.textSecondary}20`,
            p: 0.5,
            zIndex: 1002, // Higher than the overlay (999)
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            animation: "slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "@keyframes slideInFromRight": {
              from: {
                opacity: 0,
                transform: "translateX(20px)",
              },
              to: {
                opacity: 1,
                transform: "translateX(0)",
              },
            },
          }}
        >
          {/* Recurring Icon */}
          <IconButton
            onClick={props.onToggleRecurring}
            disabled={!props.onToggleRecurring}
            sx={{
              color: colors.text,
              width: 36,
              height: 36,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: colors.border,
                transform: "scale(1.1)",
              },
              "&:disabled": {
                color: colors.textSecondary,
              },
            }}
          >
            <RepeatOutlined fontSize="small" />
          </IconButton>

          {/* Group/Split Icon */}
          <IconButton
            onClick={() => {
              // Auto-enable edit mode for custom splits
              if (props.isCustomSplit) {
                props.setEditExpenseShare(true);
              } else {
                props.setEditExpenseShare(false);
              }
              props.setShowSplitExpenseSheet(true);
              props.setShowFloatingPanel(false);
            }}
            sx={{
              color: colors.text,
              width: 36,
              height: 36,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: colors.border,
                transform: "scale(1.1)",
              },
            }}
          >
            <Group fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Group-specific icons */}
      {props.isGroupExpense && !props.isIncome ? (
        <>
          {/* Delete Icon - positioned beside date/time picker for groups */}
          <IconButton
            onClick={props.onDelete}
            disabled={!props.onDelete}
            sx={{
              backgroundColor: colors.expense,
              color: colors.background,
              width: 32,
              height: 32,
              borderRadius: 3,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: colors.expense,
              },
            }}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>

          {/* Three dots / Cross icon */}
          <IconButton
            onClick={() => props.setShowFloatingPanel(!props.showFloatingPanel)}
            sx={{
              backgroundColor: colors.border,
              color: colors.text,
              width: 32,
              height: 32,
              borderRadius: 3,
            }}
          >
            {props.showFloatingPanel ? (
              <Close fontSize="small" />
            ) : (
              <MoreVert fontSize="small" />
            )}
          </IconButton>
        </>
      ) : (
        <>
          {/* Recurring Icon - non-group */}
          <IconButton
            onClick={props.onToggleRecurring}
            disabled={!props.onToggleRecurring}
            sx={{
              backgroundColor: colors.border,
              color: colors.text,
              width: 32,
              height: 32,
              borderRadius: 3,
              "&:disabled": {
                color: colors.textSecondary,
              },
            }}
          >
            <RepeatOutlined fontSize="small" />
          </IconButton>
          {/* Delete Icon - non-group */}
          <IconButton
            onClick={props.onDelete}
            disabled={!props.onDelete}
            sx={{
              backgroundColor: colors.expense,
              color: colors.background,
              width: 32,
              height: 32,
              borderRadius: 3,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: colors.expense,
              },
            }}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  );
};

export default DatetimeBar;
