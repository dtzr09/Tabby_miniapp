import { Box, Button, Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";

const FILTER_ICONS = {
  category: FilterListIcon,
  amount: AttachMoneyIcon,
  date: CalendarTodayIcon,
};

interface FilterOptionCardProps {
  label: string;
  value: string;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  type: "category" | "amount" | "date";
}
const FilterOptionCard = (props: FilterOptionCardProps) => {
  const Icon = FILTER_ICONS[props.type];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Icon sx={{ color: "#a0a0a0", fontSize: "1rem", mr: 0.5 }} />
        <Typography
          sx={{
            fontSize: "0.75rem",
            color: "#a0a0a0",
            fontWeight: 500,
          }}
        >
          {props.label}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        size="small"
        onClick={props.onClick}
        endIcon={
          <Box
            component="span"
            sx={{
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <KeyboardArrowDownOutlined fontSize="small" />
          </Box>
        }
        sx={{
          width: "100%",
          borderColor: "#4a5e80",
          bgcolor: "#4a5e80",
          color: "white",
          textTransform: "none",
          fontSize: "0.75rem",
          py: 0.5,
          borderRadius: 4,
          "& .MuiButton-endIcon": {
            color: "#a0a0a0",
          },
        }}
      >
        {props.value}
      </Button>
    </Box>
  );
};

export default FilterOptionCard;
