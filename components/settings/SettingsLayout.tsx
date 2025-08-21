import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import Navbar from "../navbar/Navbar";

interface SettingsLayoutProps {
  title: string;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  title,
  children,
  headerExtra,
}) => {
  const { colors } = useTheme();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar />
      
      {/* Fixed Header */}
      <Box
        sx={{
          px: 1.5,
          pt: 1,
          mb: 2,
          position: "relative",
          display: "flex",
          flexDirection: "column",
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
        {headerExtra && <Box sx={{ mt: 1 }}>{headerExtra}</Box>}
      </Box>

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          background: colors.background,
          px: 2,
          pb: 0,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
