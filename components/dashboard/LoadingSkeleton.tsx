import { Box, Skeleton } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";

const LoadingSkeleton = () => {
  const { colors } = useTheme();

  return (
    <Box
      sx={{
        bgcolor: colors.background,
        minHeight: "100vh",
        color: colors.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Skeleton
        variant="rectangular"
        width={300}
        height={150}
        sx={{ borderRadius: 2, backgroundColor: colors.card }}
      />
      <Skeleton
        variant="rectangular"
        width={300}
        height={100}
        sx={{ borderRadius: 2, backgroundColor: colors.card }}
      />
      <Skeleton
        variant="rectangular"
        width={300}
        height={200}
        sx={{ borderRadius: 2, backgroundColor: colors.card }}
      />
    </Box>
  );
};

export default LoadingSkeleton;
