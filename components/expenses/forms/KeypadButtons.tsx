import { useTheme } from "@/contexts/ThemeContext";
import { CheckOutlined } from "@mui/icons-material";
import { alpha, Box, Button } from "@mui/material";
import React from "react";

interface KeypadButtonsProps {
  onDateTimeChange?: (dateTime: Date) => void;
  onSubmit?: () => void;
  currentAmount: string;
  hasChanges?: boolean;
  originalIsCustomSplit: () => boolean;
  editExpenseShare: boolean;
  isCustomSplit: () => boolean;
  onAmountChange: (amount: string) => void;
  onBackspace: () => void;
  selectedDateTime: Date;
}
const KeypadButtons = (props: KeypadButtonsProps) => {
  const { colors } = useTheme();

  // Handle keypad input
  const handleKeypadPress = (value: string) => {
    // Only disable amount editing when actively editing a custom split
    if (props.editExpenseShare && props.isCustomSplit()) {
      return;
    }

    if (value === "." && props.currentAmount.includes(".")) return;

    let newAmount: string;
    if (props.currentAmount === "0" && value !== ".") {
      newAmount = value;
    } else {
      newAmount = props.currentAmount + value;
    }

    props.onAmountChange(newAmount);
  };

  // Render keypad button
  const renderKeypadButton = (value: string, isSpecial = false) => {
    const isDisabled = props.originalIsCustomSplit();
    return (
      <Button
        key={value}
        onClick={() =>
          value === "⌫" ? props.onBackspace() : handleKeypadPress(value)
        }
        disabled={isDisabled}
        sx={{
          width: "100%",
          height: 72,
          borderRadius: 3,
          backgroundColor: isDisabled
            ? alpha(colors.border, 0.5)
            : isSpecial
            ? colors.primary
            : colors.border,
          color: isDisabled
            ? alpha(colors.text, 0.3)
            : isSpecial
            ? colors.background
            : colors.text,
          fontSize: "1.5rem",
          fontWeight: 500,
          border: "none",

          "&:active": {
            transform: isDisabled ? "none" : "scale(0.98)",
          },
          "&:disabled": {
            color: alpha(colors.text, 0.3),
          },
        }}
      >
        {value}
      </Button>
    );
  };
  return (
    <Box
      sx={{
        pt: 1,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1.5,
          pb: 3,
        }}
      >
        {/* Row 1 */}
        {renderKeypadButton("1")}
        {renderKeypadButton("2")}
        {renderKeypadButton("3")}

        {/* Row 2 */}
        {renderKeypadButton("4")}
        {renderKeypadButton("5")}
        {renderKeypadButton("6")}

        {/* Row 3 */}
        {renderKeypadButton("7")}
        {renderKeypadButton("8")}
        {renderKeypadButton("9")}

        {/* Row 4 */}
        {renderKeypadButton(".")}
        {renderKeypadButton("0")}

        {/* Submit Button (Save) */}
        <Button
          onClick={() => {
            props.onDateTimeChange?.(props.selectedDateTime);
            props.onSubmit?.();
          }}
          disabled={
            !props.onSubmit || props.currentAmount === "0" || !props.hasChanges
          }
          sx={{
            height: 72,
            borderRadius: 3,
            backgroundColor: colors.background,
            color: colors.text,
            border: `2px solid ${
              props.hasChanges ? colors.text : alpha(colors.text, 0.1)
            }`,
            "&:disabled": {
              backgroundColor: colors.background,
              color: alpha(colors.text, 0.1),
            },
          }}
        >
          <CheckOutlined sx={{ fontSize: "2rem" }} />
        </Button>
      </Box>
    </Box>
  );
};

export default KeypadButtons;
