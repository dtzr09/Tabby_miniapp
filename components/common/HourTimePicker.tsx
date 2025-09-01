import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import TimeScrollPicker from "../datetimepicker/TimeScrollPicker";
import PeriodScrollPicker from "../datetimepicker/PeriodScrollPicker";

interface HourTimePickerProps {
  selectedHour: number; // 12-hour format (1-12)
  selectedPeriod: string; // "AM" or "PM"
  onHourChange: (hour: number) => void;
  onPeriodChange: (period: string) => void;
  onClose: () => void;
  anchorElementId?: string; // ID of the element to position below
}

const HourTimePicker: React.FC<HourTimePickerProps> = ({
  selectedHour,
  selectedPeriod,
  onHourChange,
  onPeriodChange,
  onClose,
  anchorElementId,
}) => {
  const { colors } = useTheme();
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (anchorElementId) {
      const anchorElement = document.getElementById(anchorElementId);
      if (anchorElement) {
        const rect = anchorElement.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 12, // 8px below the element
          left: Math.max(16, rect.right - 180), // Position to the right, but ensure 16px margin
        });
      }
    }
  }, [anchorElementId]);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          backgroundColor: colors.surface,
          borderRadius: 3,
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
          width: "160px", // Reduced width
          position: "absolute",
          top: position.top + 4,
          left: position.left,
        }}
      >
        <Box sx={{ position: "relative" }}>
          {/* Selection overlay */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "1rem",
              right: "1rem",
              transform: "translateY(-50%)",
              height: "2rem",
              backgroundColor: "rgba(75, 85, 99, 0.4)",
              borderRadius: 2,
              zIndex: 1,
            }}
          />

          {/* Picker grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr", // Only hour and AM/PM
              alignItems: "center",
              px: 0.5,
            }}
          >
            <TimeScrollPicker
              type="hour"
              value={selectedHour}
              onChange={onHourChange}
              max={12}
            />
            <PeriodScrollPicker
              value={selectedPeriod}
              onChange={onPeriodChange}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HourTimePicker;
