import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";

interface SettingsLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  title,
  children,
}) => {
  const { colors } = useTheme();

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Fixed Header */}
      <Box
        sx={{
          px: 1.5,
          pt: 1,
          mb: 2,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h3"
          sx={{
            color: colors.text,
            fontWeight: 600,
            fontSize: "1.1rem",
            textAlign: "center",
            py: 0.5,
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          background: colors.background,
          px: 2,
          pb: 2,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
