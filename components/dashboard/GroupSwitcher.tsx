import {
  KeyboardArrowDownRounded,
  PersonOutlineOutlined,
} from "@mui/icons-material";
import { Box, Button, Menu, MenuItem, Typography } from "@mui/material";
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../src/contexts/ThemeContext";
import { fetchAllEntries } from "../../services/allEntries";

export interface GroupSwitcherProps {
  groups?: Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
  }>;
  selectedGroupId?: string | null;
  setSelectedGroupId?: (groupId: string | null) => void;
  userId?: string;
  initData?: string;
  toggleWidth?: number;
}

const GroupSwitcher = (props: GroupSwitcherProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);

    // Prefetch all group data when dropdown opens (respects already-prefetched tracking)
    if (props.groups && props.userId && props.initData) {
      props.groups.forEach((group) => {
        prefetchGroupData(group.id);
      });
      // Also prefetch personal data if not selected
      prefetchGroupData(null);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGroupSelect = (groupId: string | null) => {
    if (props.setSelectedGroupId && groupId !== props.selectedGroupId) {
      props.setSelectedGroupId(groupId);
    }
    handleClose();
  };

  const prefetchGroupData = (groupId: string | null) => {
    if (!props.userId || !props.initData) return;
    if (groupId === props.selectedGroupId) return; // Don't prefetch current group

    const queryKey = ["allEntries", props.userId, groupId];
    
    // Check if query exists and is fresh (not stale)
    const queryState = queryClient.getQueryState(queryKey);
    const now = Date.now();
    const staleTime = 5 * 60 * 1000; // 5 minutes
    
    // Consider stale if no data exists or if data is older than staleTime
    const isStale = !queryState || 
                   !queryState.dataUpdatedAt || 
                   (now - queryState.dataUpdatedAt) > staleTime;
    
    // Only prefetch if data is stale or doesn't exist
    if (isStale) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn: () => fetchAllEntries(props.userId!, props.initData!, groupId),
        staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
        gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
      });
    }
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
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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
              mt: 0.5,
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: 3,
              px: 1,
              py: 0.1,
            },
          },
        }}
      >
        {props.groups?.map((group) => (
          <MenuItem
            key={group.id}
            onClick={() => handleGroupSelect(group.id)}
            onMouseEnter={() => prefetchGroupData(group.id)}
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
                  ? colors.border
                  : "transparent",
              borderRadius: 2,
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
