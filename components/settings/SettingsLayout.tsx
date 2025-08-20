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
    <>
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
      <Box
        sx={{
          background: colors.background,
          px: 1.5,
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {children}
        </Box>
      </Box>
    </>
  );
};
