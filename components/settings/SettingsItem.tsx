import React from "react";
import { Box, Typography } from "@mui/material";
import { ArrowForwardIos } from "@mui/icons-material";
import { useTheme } from "../../src/contexts/ThemeContext";

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  value?: string;
  onClick: () => void;
  showBorder?: boolean;
  onMouseEnter?: () => void;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  value,
  onClick,
  showBorder = true,
  onMouseEnter,
}) => {
  const { colors } = useTheme();

  return (
    <Box
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 1.5,
        px: 2,
        borderBottom: showBorder ? `1px solid ${colors.border}` : "none",
        cursor: "pointer",
        "&:hover": {
          bgcolor: colors.border,
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            color: colors.text,
            fontSize: "0.95rem",
            fontWeight: 500,
          }}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
        {value && (
          <Typography
            sx={{
              color: colors.textSecondary,
              fontSize: "0.85rem",
            }}
          >
            {value}
          </Typography>
        )}
        <ArrowForwardIos
          sx={{ color: colors.textSecondary }}
          fontSize="small"
          style={{
            fontSize: "0.8rem",
          }}
        />
      </Box>
    </Box>
  );
};