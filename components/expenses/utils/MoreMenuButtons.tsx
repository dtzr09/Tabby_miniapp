import { IconButton, Box, Typography } from "@mui/material";
import {
  FilterAltRounded,
  SearchRounded,
  CloseRounded,
  MoreHorizRounded,
} from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { alpha } from "@mui/material/styles";
import { FilterType } from "../../../utils/advancedFilterUtils";

interface MoreMenuButtonsProps {
  moreMenuAnchor: HTMLElement | null;
  setMoreMenuAnchor: (anchor: HTMLElement | null) => void;
  filterMenuAnchor: HTMLElement | null;
  setFilterMenuAnchor: (anchor: HTMLElement | null) => void;
  handleSearchToggle: () => void;
  selectedFilter: FilterType;
  onClearFilter: () => void;
}

const MoreMenuButtons = ({
  moreMenuAnchor,
  setMoreMenuAnchor,
  filterMenuAnchor,
  setFilterMenuAnchor,
  handleSearchToggle,
  selectedFilter,
  onClearFilter,
}: MoreMenuButtonsProps) => {
  const { colors } = useTheme();

  const getFilterLabel = (filter: FilterType) => {
    switch (filter) {
      case "type":
        return "by type";
      case "category":
        return "by category";
      default:
        return null;
    }
  };

  const filterLabel = getFilterLabel(selectedFilter);

  return (
    <>
      {!moreMenuAnchor ? (
        <IconButton
          onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
          sx={{
            color: colors.text,
            p: 0.5,
            "&:hover": {
              color: colors.primary,
              bgcolor: alpha(colors.primary, 0.1),
            },
            transition: "all 0.2s ease-in-out",
            position: "absolute",
            right: 0,
          }}
        >
          <MoreHorizRounded sx={{ fontSize: "1.2rem" }} />
        </IconButton>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            position: "absolute",
            right: 0,
            gap: 0.8,
          }}
        >
          {filterLabel ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                bgcolor: colors.incomeExpenseCard,
                p: "5px 8px",
                borderRadius: 2,
                cursor: "pointer",
                "&:hover": {
                  bgcolor: alpha(colors.primary, 0.1),
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: colors.primary,
                }}
              >
                {filterLabel}
              </Typography>
              <CloseRounded
                onClick={onClearFilter}
                sx={{
                  fontSize: "0.7rem",
                  color: colors.textSecondary,
                  cursor: "pointer",
                }}
              />
            </Box>
          ) : (
            <IconButton
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              sx={{
                p: 0.8,
                bgcolor: colors.incomeExpenseCard,
                color: Boolean(filterMenuAnchor) ? colors.primary : colors.text,
                cursor: "pointer",
                "&:hover": {
                  color: colors.primary,
                  bgcolor: alpha(colors.primary, 0.1),
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <FilterAltRounded sx={{ fontSize: "1rem" }} />
            </IconButton>
          )}
          <IconButton
            onClick={handleSearchToggle}
            sx={{
              color: colors.text,
              p: 0.8,
              bgcolor: colors.incomeExpenseCard,
              "&:hover": {
                color: colors.primary,
                bgcolor: alpha(colors.primary, 0.1),
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            <SearchRounded sx={{ fontSize: "1rem" }} />
          </IconButton>
          <IconButton
            onClick={() => setMoreMenuAnchor(null)}
            sx={{
              color: colors.text,
              p: 0.8,
              bgcolor: colors.incomeExpenseCard,
              "&:hover": {
                color: colors.primary,
                bgcolor: alpha(colors.primary, 0.1),
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            <CloseRounded sx={{ fontSize: "1rem" }} />
          </IconButton>
        </Box>
      )}
    </>
  );
};

export default MoreMenuButtons;
