import { Box, Typography } from "@mui/material";
import React from "react";
import { useTheme } from "../../src/contexts/ThemeContext";
import { chartColors } from "../../utils/chartColors";

interface ChartLegendProps {
  data: {
    name: string;
    value: number;
    fill: string;
  }[];
}
const ChartLegend = (props: ChartLegendProps) => {
  const { colors } = useTheme();

  if (props.data.length === 0) return null;

  return (
    <>
      <Box
        sx={{
          mt: 3,
          display: "flex",
          justifyContent: "center",
          gap: {
            xs: 2,
            sm: 4,
          },
          mb: 3,
        }}
      >
        {/* Left Column */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: {
              xs: 1,
              sm: 1.5,
            },
            alignItems: "flex-end",
            minWidth: "120px",
          }}
        >
          {props.data
            .slice(0, Math.ceil(props.data.length / 2))
            .map((entry, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: chartColors[idx % chartColors.length],
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{
                    color: colors.textSecondary,
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    textAlign: "right",
                  }}
                >
                  {entry.name}
                </Typography>
              </Box>
            ))}
        </Box>

        {/* Right Column */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            mb: 3,
            alignItems: "flex-start",
          }}
        >
          {props.data
            .slice(Math.ceil(props.data.length / 2))
            .map((entry, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor:
                      chartColors[
                        Math.ceil(props.data.length / 2) +
                          (idx % chartColors.length)
                      ],
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{
                    color: colors.textSecondary,
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    textAlign: "left",
                    flex: 1,
                  }}
                >
                  {entry.name}
                </Typography>
              </Box>
            ))}
        </Box>
      </Box>
    </>
  );
};

export default ChartLegend;
