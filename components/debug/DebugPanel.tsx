import React, { useState } from "react";
import { Box, Typography, Paper, IconButton, Chip } from "@mui/material";
import {
  BugReport,
  Close,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useTheme } from "../../src/contexts/ThemeContext";

interface DebugPanelProps {
  keyboardHeight?: number;
  formState?: {
    isDirty?: boolean;
    isValid?: boolean;
    selectedCategoryId?: number;
    currentAmount?: string;
    description?: string;
    selectedDateTime?: string;
  };
  dimensions?: {
    width: number;
    height: number;
  };
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalInfo?: Record<string, any>;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  keyboardHeight = 0,
  formState,
  dimensions,
  additionalInfo = {},
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) {
    return (
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          left: 16,
          zIndex: 9999,
        }}
      >
        <IconButton
          onClick={() => setIsOpen(true)}
          sx={{
            backgroundColor: colors.primary,
            color: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <BugReport />
        </IconButton>
      </Box>
    );
  }

  if (isMinimized) {
    return (
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          left: 16,
          zIndex: 9999,
        }}
      >
        <Paper
          sx={{
            p: 1,
            backgroundColor: colors.surface,
            color: colors.text,
            minWidth: 200,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BugReport sx={{ fontSize: 16, color: colors.primary }} />
            <Typography variant="caption" sx={{ flex: 1 }}>
              Debug Panel
            </Typography>
            <IconButton
              size="small"
              onClick={() => setIsMinimized(false)}
              sx={{ color: colors.textSecondary }}
            >
              <Visibility sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setIsOpen(false)}
              sx={{ color: colors.textSecondary }}
            >
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`KB: ${keyboardHeight}px`}
              size="small"
              color={keyboardHeight > 0 ? "success" : "default"}
              sx={{ mr: 1, mb: 0.5 }}
            />
            {formState?.isDirty && (
              <Chip
                label="Dirty"
                size="small"
                color="warning"
                sx={{ mr: 1, mb: 0.5 }}
              />
            )}
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: 16,
        zIndex: 9999,
        maxWidth: 350,
        maxHeight: "60vh",
        overflowY: "auto",
      }}
    >
      <Paper
        sx={{
          p: 2,
          backgroundColor: colors.surface,
          color: colors.text,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <BugReport sx={{ mr: 1, color: colors.primary }} />
          <Typography variant="h6" sx={{ flex: 1 }}>
            Debug Panel
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIsMinimized(true)}
            sx={{ color: colors.textSecondary, mr: 1 }}
          >
            <VisibilityOff />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setIsOpen(false)}
            sx={{ color: colors.textSecondary }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Keyboard Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: colors.primary }}>
            Keyboard
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip
              label={`Height: ${keyboardHeight}px`}
              size="small"
              color={keyboardHeight > 0 ? "success" : "default"}
            />
            <Chip
              label={keyboardHeight > 0 ? "Visible" : "Hidden"}
              size="small"
              color={keyboardHeight > 0 ? "success" : "default"}
            />
          </Box>
        </Box>

        {/* Dimensions */}
        {dimensions && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: colors.primary }}
            >
              Screen
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                label={`${dimensions.width}×${dimensions.height}`}
                size="small"
                color="info"
              />
              <Chip
                label={
                  dimensions.width > dimensions.height
                    ? "Landscape"
                    : "Portrait"
                }
                size="small"
                color="info"
              />
            </Box>
          </Box>
        )}

        {/* Form State */}
        {formState && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: colors.primary }}
            >
              Form State
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                <Chip
                  label={`Dirty: ${formState.isDirty ? "Yes" : "No"}`}
                  size="small"
                  color={formState.isDirty ? "warning" : "success"}
                />
                <Chip
                  label={`Valid: ${formState.isValid ? "Yes" : "No"}`}
                  size="small"
                  color={formState.isValid ? "success" : "error"}
                />
              </Box>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Category ID:{" "}
                <strong>{formState.selectedCategoryId ?? "undefined"}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Amount: <strong>{formState.currentAmount || "0"}</strong>
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.textSecondary,
                  wordBreak: "break-word",
                  maxWidth: "100%",
                }}
              >
                Description:{" "}
                <strong>{formState.description || "(empty)"}</strong>
              </Typography>
              {formState.selectedDateTime && (
                <Typography
                  variant="body2"
                  sx={{ color: colors.textSecondary }}
                >
                  Date:{" "}
                  <strong>
                    {new Date(formState.selectedDateTime).toLocaleString()}
                  </strong>
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Height Debug Info */}
        {additionalInfo?.heightInfo && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: colors.primary }}
            >
              Height Calculation
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Final Height: <strong>{additionalInfo.heightInfo.calculatedHeight}px</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Base Height: <strong>{additionalInfo.heightInfo.baseHeight}px</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Screen Height: <strong>{additionalInfo.heightInfo.dimensionsHeight}px</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                Bottom Nav: <strong>{additionalInfo.heightInfo.bottomNavigationHeight}px</strong>
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                <Chip
                  label={`Keyboard: ${additionalInfo.heightInfo.keyboardHeight}px`}
                  size="small"
                  color={additionalInfo.heightInfo.keyboardHeight > 0 ? "success" : "default"}
                />
                <Chip
                  label={additionalInfo.heightInfo.keyboardHeight > 0 ? "KB Active" : "KB Inactive"}
                  size="small"
                  color={additionalInfo.heightInfo.keyboardHeight > 0 ? "warning" : "default"}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* Additional Info */}
        {Object.keys(additionalInfo).length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: colors.primary }}
            >
              Additional Info
            </Typography>
            <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
              {Object.entries(additionalInfo).map(([key, value]) => {
                if (key === 'heightInfo') return null; // Skip heightInfo as we display it separately
                return (
                  <Typography
                    key={key}
                    variant="body2"
                    sx={{
                      color: colors.textSecondary,
                      mb: 0.5,
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      wordBreak: "break-all",
                    }}
                  >
                    <strong>{key}:</strong> {JSON.stringify(value)}
                  </Typography>
                );
              })}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DebugPanel;
