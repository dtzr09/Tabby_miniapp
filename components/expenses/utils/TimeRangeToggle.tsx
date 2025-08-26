import {
  Box,
  IconButton,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  ArrowBackIosNewOutlined,
  ArrowForwardIosOutlined,
  InfoOutlined,
} from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";

interface TimeRangeToggleProps {
  timeRange: string;
  setTimeOffset: (offset: number) => void;
  timeOffset: number;
  canGoBack?: boolean;
}

const TimeRangeToggle = ({
  timeRange,
  setTimeOffset,
  timeOffset,
  canGoBack = true,
}: TimeRangeToggleProps) => {
  const { colors } = useTheme();
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, py: 1 }}>
        <IconButton
          sx={{
            color: colors.text,
            p: 0,
            "&.Mui-disabled": {
              color: colors.textSecondary,
            },
          }}
          onClick={() => setTimeOffset(timeOffset - 1)}
          disabled={!canGoBack}
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
            color: colors.text,
            p: 0,
            "&.Mui-disabled": {
              color: colors.textSecondary,
            },
          }}
          onClick={() => setTimeOffset(timeOffset + 1)}
          disabled={timeOffset >= 0}
        >
          <ArrowForwardIosOutlined sx={{ fontSize: "0.8rem" }} />
        </IconButton>
        <IconButton
          onClick={() => setInfoOpen(true)}
          sx={{
            color: colors.textSecondary,
            p: 0,
            ml: 0.5,
          }}
        >
          <InfoOutlined sx={{ fontSize: "0.8rem" }} />
        </IconButton>
      </Box>

      <Dialog
        disableScrollLock
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: colors.background,
            maxWidth: "300px",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: colors.text,
            fontSize: "0.9rem",
            fontWeight: 600,
            pb: 1,
          }}
        >
          Chart Information
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              color: colors.text,
              fontSize: "0.8rem",
            }}
          >
            This bar chart currently only reflects expenses. Income transactions
            are not included in this visualization.
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimeRangeToggle;
