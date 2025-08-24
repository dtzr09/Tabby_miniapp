import React, { ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";

export interface BottomSheetButton {
  text: string;
  onClick: () => void;
  variant?: "primary" | "destructive" | "secondary";
  disabled?: boolean;
}

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  buttons?: BottomSheetButton[];
  children?: ReactNode;
  height?: string;
  actionButtons?: ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  description,
  buttons,
  children,
  height,
  actionButtons,
}) => {
  const { colors } = useTheme();

  if (!open) return null;

  const getButtonStyles = (variant: BottomSheetButton["variant"]) => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "#007AFF",
          color: "white",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "#007AFF",
            opacity: 0.9,
          },
          "&:active": {
            backgroundColor: "#007AFF",
            opacity: 0.8,
          },
          "&:disabled": {
            backgroundColor: colors.textSecondary + "30",
            color: colors.textSecondary,
          },
        };
      case "destructive":
        return {
          backgroundColor: "#FF3B30",
          color: "white",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "#FF3B30",
            opacity: 0.9,
          },
          "&:active": {
            backgroundColor: "#FF3B30",
            opacity: 0.8,
          },
        };
      case "secondary":
      default:
        return {
          color: colors.text,
          backgroundColor: "transparent",
          "&:hover": {
            backgroundColor: colors.textSecondary + "15",
          },
        };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 1299,
        }}
      />

      {/* Bottom Sheet */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: colors.background,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 2,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
          zIndex: 1300,
          width: "calc(100% - 1rem)",
          maxWidth: "28rem",
          animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "@keyframes slideUp": {
            from: {
              transform: "translateX(-50%) translateY(100%)",
              opacity: 0,
            },
            to: {
              transform: "translateX(-50%) translateY(0)",
              opacity: 1,
            },
          },
          height: height,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {/* Title */}
            <Typography
              variant="h6"
              sx={{
                color: colors.text,
                fontWeight: 600,
                marginBottom: description || children ? 0.5 : 1.5,
                textAlign: "left",
                fontSize: "1.1rem",
              }}
            >
              {title || ""}
            </Typography>

            {/* Description */}
            {description && (
              <Typography
                sx={{
                  color: colors.textSecondary,
                  marginBottom: children ? 1.5 : 2,
                  textAlign: "left",
                  fontSize: "0.85rem",
                  lineHeight: 1.4,
                }}
              >
                {description}
              </Typography>
            )}
          </Box>

          {/* Action Buttons */}
          {actionButtons && actionButtons}
        </Box>

        {/* Custom Content */}
        {children && <Box sx={{ marginBottom: 2.5 }}>{children}</Box>}

        {/* Buttons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            width: "100%",
          }}
        >
          {buttons &&
            buttons.map((button, index) => (
              <Button
                key={index}
                fullWidth
                variant={button.variant === "secondary" ? "text" : "contained"}
                onClick={button.onClick}
                disabled={button.disabled}
                sx={{
                  fontSize: "0.9rem",
                  fontWeight: button.variant === "secondary" ? 500 : 600,
                  py: 0.9,
                  borderRadius: 2,
                  minHeight: "auto",
                  transition: "all 0.2s ease",
                  ...getButtonStyles(button.variant),
                }}
              >
                {button.text}
              </Button>
            ))}
        </Box>
      </Box>
    </>
  );
};

export default BottomSheet;
