import { Box, Button, Theme, SxProps } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
interface TimeDisplayProps {
  selectedHour: number;
  selectedMinute: number;
  selectedPeriod: string;
  showTimePicker: boolean;
  setShowTimePicker: (show: boolean) => void;
  setShowMonthPicker: (show: boolean) => void;
  showCaption?: boolean;
  sx?: SxProps<Theme>;
  minified?: boolean;
}
const TimeDisplay = (props: TimeDisplayProps) => {
  const { colors } = useTheme();
  return (
    <Box
      sx={{
        width: "100%",
        margin: "auto",
        marginTop: "0.5rem",
        paddingTop: "0.5rem",
        px: "0.5rem",
        borderTop: `1px solid ${colors.border}`,
        ...props.sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {props.showCaption && (
          <span style={{ color: colors.text, fontSize: "1rem" }}>Time</span>
        )}
        <Button
          variant="text"
          onClick={() => {
            props.setShowTimePicker(!props.showTimePicker);
            if (!props.showTimePicker) {
              props.setShowMonthPicker(false);
            }
          }}
          sx={{
            color: colors.text,
            fontSize: props.minified ? "0.9rem" : "1rem",
            letterSpacing: "0.05rem",
            whiteSpace: "nowrap",
            textTransform: "none",
            backgroundColor: colors.card,
            borderRadius: 3,
            px: 1,
            py: 0.5,
          }}
        >
          {props.selectedHour}:
          {props.selectedMinute.toString().padStart(2, "0")} {""}
          {props.selectedPeriod}
        </Button>
      </Box>
    </Box>
  );
};

export default TimeDisplay;
