import { Box, Typography } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { ViewMode } from "../../../utils/types";

interface TimeFrameProps {
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  currentTimeFrame: ViewMode;
}

const TimeFrame = ({
  viewMode,
  onViewModeChange,
  currentTimeFrame,
}: TimeFrameProps) => {
  const { colors } = useTheme();
  return (
    <Box
      key={currentTimeFrame}
      sx={{
        position: "relative",
        cursor: "pointer",
        py: 0.5,
      }}
      onClick={() => {
        if (viewMode !== currentTimeFrame) {
          onViewModeChange?.(currentTimeFrame);
        }
      }}
    >
      <Typography
        sx={{
          fontWeight: viewMode === currentTimeFrame ? 700 : 500,
          fontSize: "1rem",
          color:
            viewMode === currentTimeFrame ? colors.text : colors.textSecondary,
          textTransform: "capitalize",
        }}
      >
        {currentTimeFrame}
      </Typography>
      {viewMode === currentTimeFrame && (
        <Box
          sx={{
            position: "absolute",
            bottom: -8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: colors.primary,
          }}
        />
      )}
    </Box>
  );
};

export default TimeFrame;
