import React from "react";
import { Box } from "@mui/material";

interface CustomToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "small" | "medium";
}

const CustomToggle: React.FC<CustomToggleProps> = ({
  checked,
  onChange,
  size = "small",
}) => {
  const dimensions = size === "small" ? { width: 44, height: 26, thumbSize: 22 } : { width: 60, height: 34, thumbSize: 32 };

  return (
    <Box
      onClick={() => onChange(!checked)}
      sx={{
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: dimensions.height / 2,
        backgroundColor: checked ? "#34C759" : "#39393D",
        cursor: "pointer",
        position: "relative",
        transition: "background-color 0.2s ease",
        display: "flex",
        alignItems: "center",
        padding: "2px",
      }}
    >
      <Box
        sx={{
          width: dimensions.thumbSize,
          height: dimensions.thumbSize,
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          position: "absolute",
          left: checked ? `${dimensions.width - dimensions.thumbSize - 2}px` : "2px",
          transition: "left 0.2s ease",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        }}
      />
    </Box>
  );
};

export default CustomToggle;