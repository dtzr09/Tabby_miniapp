import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
}) => {
  const { colors } = useTheme();

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="overline"
        sx={{
          color: colors.primary,
          fontWeight: 600,
          fontSize: "0.7rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 0.5,
          display: "block",
        }}
      >
        {title}
      </Typography>
      <Card
        sx={{
          borderRadius: 2,
          bgcolor: colors.border,
          boxShadow: 0,
          border: `1px solid ${colors.border}`,
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
};
