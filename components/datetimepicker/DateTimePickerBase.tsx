import { Box } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import TimeScrollPicker from "./TimeScrollPicker";
import PeriodScrollPicker from "./PeriodScrollPicker";

interface DateTimePickerBaseProps {
  date: Date;
  onDateChange: (date: Date) => void;
  selectedHour: number;
  setSelectedHour: (hour: number) => void;
  selectedMinute?: number;
  setSelectedMinute?: (minute: number) => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  showHourOnly?: boolean;
}

const DateTimePickerBase = (props: DateTimePickerBaseProps) => {
  const { colors } = useTheme();

  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        backgroundColor: colors.surface,
        borderRadius: 2,
        position: "absolute",
        bottom: 0,
        right: 0,
        zIndex: 20,
        width: "fit-content",
        p: "0.25rem",
        mx: 1,
        boxShadow: "0 0 30px 8px rgba(0, 0, 0, 0.4)",
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "0.8rem",
            right: "0.8rem",
            transform: "translateY(-50%)",
            height: "2rem",
            backgroundColor: "rgba(75, 85, 99,0.4)",
            borderRadius: 2.5,
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            alignItems: "center",
            py: 0.8,
            px: 1,
          }}
        >
          <TimeScrollPicker
            type="hour"
            value={props.selectedHour}
            onChange={props.setSelectedHour}
            max={12}
          />
          {!props.showHourOnly && (
            <TimeScrollPicker
              type="minute"
              value={props.selectedMinute ?? 0}
              onChange={props.setSelectedMinute ?? (() => {})}
              max={59}
            />
          )}
          <PeriodScrollPicker
            value={props.selectedPeriod}
            onChange={props.setSelectedPeriod}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default DateTimePickerBase;
