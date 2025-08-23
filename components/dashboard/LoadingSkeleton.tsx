import { Box, Skeleton } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { AppLayout } from "../AppLayout";

const LoadingSkeleton = () => {
  const { colors } = useTheme();
  return (
    <AppLayout>
      <Box
        sx={{
          px: 2,
          pt: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Skeleton
          variant="rectangular"
          height={200}
          width="100%"
          sx={{ borderRadius: 2, backgroundColor: colors.card }}
        />
        <Skeleton
          variant="rectangular"
          height={150}
          width="100%"
          sx={{ borderRadius: 2, backgroundColor: colors.card }}
        />
        <Skeleton
          variant="rectangular"
          height={200}
          width="100%"
          sx={{ borderRadius: 2, backgroundColor: colors.card }}
        />
      </Box>
    </AppLayout>
  );
};

export default LoadingSkeleton;
