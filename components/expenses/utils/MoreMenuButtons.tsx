import { IconButton, Box, Typography } from "@mui/material";
import {
  FilterAltRounded,
  SearchRounded,
  CloseRounded,
  MoreHorizRounded,
} from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { FilterType } from "../../../utils/advancedFilterUtils";

interface MoreMenuButtonsProps {
  moreMenuAnchor: null | HTMLElement;
  setMoreMenuAnchor: (anchor: null | HTMLElement) => void;
  filterMenuAnchor: null | HTMLElement;
  setFilterMenuAnchor: (anchor: null | HTMLElement) => void;
  handleSearchToggle: () => void;
  selectedFilter: FilterType;
  onClearFilter: () => void;
}

export default function MoreMenuButtons({
  moreMenuAnchor,
  setMoreMenuAnchor,
  filterMenuAnchor,
  setFilterMenuAnchor,
  handleSearchToggle,
  selectedFilter,
  onClearFilter,
}: MoreMenuButtonsProps) {
  const { colors } = useTheme();

  const handleClose = () => {
    setMoreMenuAnchor(null);
    onClearFilter();
  };

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

                transition: "all 0.2s ease-in-out",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: colors.primary,
                }}
              >
                {filterLabel}
              </Typography>
              <CloseRounded
                onClick={onClearFilter}
                sx={{
                  fontSize: "0.8rem",
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

              transition: "all 0.2s ease-in-out",
            }}
          >
            <SearchRounded sx={{ fontSize: "1rem" }} />
          </IconButton>
          <IconButton
            onClick={handleClose}
            sx={{
              color: colors.text,
              p: 0.8,
              bgcolor: colors.incomeExpenseCard,

              transition: "all 0.2s ease-in-out",
            }}
          >
            <CloseRounded sx={{ fontSize: "1rem" }} />
          </IconButton>
        </Box>
      )}
    </>
  );
}
