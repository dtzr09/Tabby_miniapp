import { Typography } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { ChartDataPoint } from "../../utils/types";

interface ChartToolTipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    payload: ChartDataPoint;
  }[];
  label?: string;
}
export const ChartToolTip = ({ active, payload, label }: ChartToolTipProps) => {
  const { fontFamily } = useTheme();
  const isVisible = active && payload && payload.length > 0;

  const amount =
    isVisible && payload?.[0]?.payload?.amount != null
      ? payload[0].payload.amount.toFixed(2)
      : null;

  return (
    <div
      className="custom-tooltip"
      style={{
        visibility: isVisible ? "visible" : "hidden",
        backgroundColor: "black",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: "4px 8px",
        fontSize: "0.875rem",
        fontWeight: 500,
        textAlign: "center",
        minWidth: "100px",
        zIndex: 1000,
      }}
    >
      {isVisible && amount && (
        <Typography
          variant="caption"
          className="label"
          style={{
            color: "white",
            fontSize: "0.75rem",
            fontWeight: 500,
            fontFamily: fontFamily,
          }}
        >
          {`${label} : $${amount}`}
        </Typography>
      )}
    </div>
  );
};
