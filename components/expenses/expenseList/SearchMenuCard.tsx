import { useTheme } from "@/contexts/ThemeContext";
import { MenuItem, Paper, Popper } from "@mui/material";

export interface SearchMenuCardProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  menuItems: string[];
  setValue: (value: string) => void;
  value: string;
  displayValue?: string;
  setAnchor: (anchor: HTMLElement | null) => void;
}

const SearchMenuCard = (props: SearchMenuCardProps) => {
  const { colors } = useTheme();

  return (
    <Popper
      open={props.open}
      anchorEl={props.anchorEl}
      placement="bottom-start"
      modifiers={[
        {
          name: "offset",
          options: {
            offset: [0, 8], // same as mt: 1
          },
        },
        {
          name: "preventOverflow",
          options: {
            boundary: "window",
          },
        },
      ]}
      style={{ zIndex: 1300 }} // ensure it's above modal/dialogs if needed
    >
      <Paper
        sx={{
          bgcolor: colors.inputBg,
          border: `1px solid ${colors.border}`,
          width: props.anchorEl?.offsetWidth || "auto",
          borderRadius: 2,
          px: 1,
          py: 1,
        }}
      >
        {props.menuItems.map((item) => (
          <MenuItem
            key={item}
            onClick={() => {
              props.setValue(item);
              props.setAnchor(null);
            }}
            sx={{
              color: colors.text,
              bgcolor: props.displayValue === item ? "#374a69" : "transparent",
              borderRadius: 2,
            }}
          >
            {item}
          </MenuItem>
        ))}
      </Paper>
    </Popper>
  );
};

export default SearchMenuCard;
