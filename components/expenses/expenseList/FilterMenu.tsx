import { Menu, MenuItem, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { useTheme } from "@/contexts/ThemeContext";
import { alpha } from "@mui/material/styles";
import { FilterType } from "../../../utils/advancedFilterUtils";
import { CategoryOutlined, SellOutlined } from "@mui/icons-material";

interface FilterMenuProps {
  selectedFilter: FilterType;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onFilterChange: (type: FilterType) => void;
}

const FILTER_OPTIONS = [
  { id: "type" as const, label: "by type", Icon: SellOutlined },
  { id: "category" as const, label: "by category", Icon: CategoryOutlined },
] as const;

export default function FilterMenu({
  selectedFilter,
  anchorEl,
  onClose,
  onFilterChange,
}: FilterMenuProps) {
  const { colors } = useTheme();

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      disableScrollLock
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          bgcolor: colors.card,
          borderRadius: 2,
          minWidth: 150,
          "& .MuiMenuItem-root": {
            minHeight: 25,
            py: 0.5,
          },
        },
      }}
    >
      {FILTER_OPTIONS.map(({ id, label, Icon }) => (
        <MenuItem
          key={id}
          onClick={() => {
            onFilterChange(id);
            onClose();
          }}
          sx={{
            color: colors.text,
            bgcolor:
              selectedFilter === id
                ? alpha(colors.primary, 0.08)
                : "transparent",
            "&:hover": {
              bgcolor:
                selectedFilter === id
                  ? alpha(colors.primary, 0.15)
                  : alpha(colors.primary, 0.1),
            },
            display: "flex",
            alignItems: "center",
            gap: 1,
            py: 0.5,
            px: 1,
          }}
        >
          <Icon
            sx={{
              color: selectedFilter === id ? colors.primary : colors.text,
              fontSize: "0.7rem",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.7rem",
              fontWeight: 500,
              color: selectedFilter === id ? colors.primary : colors.text,
              flex: 1,
            }}
          >
            {label}
          </Typography>
          {selectedFilter === id && (
            <CheckIcon
              sx={{ ml: "auto", color: colors.primary, fontSize: "0.7rem" }}
            />
          )}
        </MenuItem>
      ))}
    </Menu>
  );
}
