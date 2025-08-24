import { IconButton, Tooltip } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { Expense } from "../../utils/types";
import { useState } from "react";

interface SplitInfoTooltipProps {
  expense?: Expense;
  currentAmount?: string;
  isEditMode?: boolean;
}

const SplitInfoTooltip = ({
  expense,
  currentAmount,
  isEditMode = false,
}: SplitInfoTooltipProps) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  // Calculate if this is an equal split
  const currentAmountValue = parseFloat(currentAmount || "0");
  const amountPerPerson = expense?.shares?.length
    ? currentAmountValue / expense.shares.length
    : currentAmountValue;
  const isEqualSplit = expense?.shares?.every(
    (share) => Math.abs(share.share_amount - amountPerPerson) < 0.01
  ) ?? true;

  // Create tooltip content based on edit state
  const getTooltipContent = () => {
    if (isEditMode) {
      return "Edit Mode: Modify individual amounts by typing in the input fields. This creates a custom split.";
    }
    return isEqualSplit
      ? "Equal Split: Changing the total amount automatically splits equally among all members."
      : "Custom Split: Individual amounts are set manually. Use Edit to modify split amounts.";
  };

  const handleClick = () => {
    setOpen(!open);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Tooltip
      title={getTooltipContent()}
      placement="top"
      open={open}
      onClose={handleClose}
      disableHoverListener
      disableFocusListener
      disableTouchListener
      sx={{
        "& .MuiTooltip-tooltip": {
          backgroundColor: colors.surface,
          color: colors.text,
          fontSize: "0.8rem",
          maxWidth: 300,
          padding: 1.5,
          borderRadius: 2,
          boxShadow: `0 4px 20px ${colors.textSecondary}40`,
        },
        "& .MuiTooltip-arrow": {
          color: colors.surface,
        },
      }}
      arrow
    >
      <IconButton
        onClick={handleClick}
        sx={{
          padding: 0.25,
          color: colors.textSecondary,
          "&:hover": {
            color: colors.primary,
            backgroundColor: "transparent",
          },
        }}
      >
        <InfoOutlined sx={{ fontSize: "1rem" }} />
      </IconButton>
    </Tooltip>
  );
};

export default SplitInfoTooltip;
