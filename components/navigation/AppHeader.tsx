import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useUserPreferences } from "../../src/contexts/UserPreferencesContext";

const AppHeader = () => {
  const { colors } = useTheme();
  const { preferences } = useUserPreferences();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      timeZone: preferences.timezone || "Asia/Singapore",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: preferences.timezone || "Asia/Singapore",
    });
  };

  return (
    <Box
      sx={{
        background: colors.card,
        px: 2,
        py: 1,
        borderBottom: `1px solid ${colors.surface}`,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: colors.text,
          fontWeight: 600,
          fontSize: "1.125rem",
        }}
      >
        Tabby
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: colors.textSecondary,
          fontSize: "0.75rem",
        }}
      >
        {formatTime(currentTime)} • {formatDate(currentTime)}
      </Typography>
    </Box>
  );
};

export default AppHeader; 