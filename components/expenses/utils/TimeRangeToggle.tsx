import { Box, IconButton, Typography } from "@mui/material";
import {
  ArrowBackIosNewOutlined,
  ArrowForwardIosOutlined,
} from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";

interface TimeRangeToggleProps {
  timeRange: string;
  setTimeOffset: (offset: number) => void;
  timeOffset: number;
}

const TimeRangeToggle = ({
  timeRange,
  setTimeOffset,
  timeOffset,
}: TimeRangeToggleProps) => {
  const { colors } = useTheme();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, py: 1 }}>
      <IconButton
        sx={{ color: colors.primary, p: 0 }}
        onClick={() => setTimeOffset(timeOffset - 1)}
      >
        <ArrowBackIosNewOutlined sx={{ fontSize: "0.8rem" }} />
      </IconButton>
      <Typography
        variant="h3"
        sx={{ color: colors.text, fontSize: "0.8rem", fontWeight: 600 }}
      >
        {timeRange}
      </Typography>
      <IconButton
        sx={{ 
          color: colors.primary, 
          p: 0,
          "&.Mui-disabled": {
            color: colors.textSecondary,
          }
        }}
        onClick={() => setTimeOffset(timeOffset + 1)}
        disabled={timeOffset >= 0}
      >
        <ArrowForwardIosOutlined sx={{ fontSize: "0.8rem" }} />
      </IconButton>
    </Box>
  );
};

export default TimeRangeToggle;
