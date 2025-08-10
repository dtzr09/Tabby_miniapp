import { Box, Skeleton } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";

const LoadingSkeleton = () => {
  const { colors } = useTheme();

  return (
    <Box
      sx={{
        bgcolor: colors.background,
        height: "100%",
        width: "100%",
        px: 6,
        pt: "var(--safe-top)",
        pb: "var(--safe-bottom)",
        color: colors.text,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Skeleton
        variant="rectangular"
        height={200}
        width="100%"
        sx={{ borderRadius: 2, backgroundColor: colors.inputBg }}
      />
      <Skeleton
        variant="rectangular"
        height={150}
        width="100%"
        sx={{ borderRadius: 2, backgroundColor: colors.inputBg }}
      />
      <Skeleton
        variant="rectangular"
        height={200}
        width="100%"
        sx={{ borderRadius: 2, backgroundColor: colors.inputBg }}
      />
    </Box>
  );
};

export default LoadingSkeleton;
