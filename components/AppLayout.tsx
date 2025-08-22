import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface AppLayoutProps {
  title?: string;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}

// Create a context to share dimensions
export const DimensionsContext = React.createContext<{
  width: number;
  height: number;
}>({ width: 0, height: 0 });

export const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  children,
  headerExtra,
}) => {
  const { colors } = useTheme();
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial dimensions
    updateDimensions();

    // Listen for resize events
    window.addEventListener("resize", updateDimensions);

    // Also listen for orientation changes on mobile
    window.addEventListener("orientationchange", () => {
      setTimeout(updateDimensions, 100);
    });

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("orientationchange", updateDimensions);
    };
  }, []);

  return (
    <DimensionsContext.Provider value={dimensions}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          overflow: "hidden",
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
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
        {title && (
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
        )}
        {headerExtra && <Box sx={{ mt: 1 }}>{headerExtra}</Box>}
      </Box>
      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          background: colors.background,
          px: 2,
          pb: 0,
          width: "100%",
          maxWidth: `${dimensions.width}px`,
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minHeight: "100%",
            width: "100%",
            maxWidth: "100%",
            overflowX: "hidden",
            boxSizing: "border-box",
          }}
        >
          {children}
        </Box>
      </Box>
      </Box>
    </DimensionsContext.Provider>
  );
};
