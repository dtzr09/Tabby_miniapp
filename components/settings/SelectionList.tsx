import React from "react";
import { Box, Typography, Card, CardContent, Skeleton } from "@mui/material";
import { Check } from "@mui/icons-material";
import { useTheme } from "../../src/contexts/ThemeContext";

interface SelectionItem {
  id: string;
  label: string;
  subtitle?: string;
}

interface SelectionListProps {
  items: SelectionItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  skeletonCount?: number;
}

export const SelectionList: React.FC<SelectionListProps> = ({
  items,
  selectedId,
  onSelect,
  isLoading = false,
  skeletonCount = 8,
}) => {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 2, bgcolor: colors.card, boxShadow: 0 }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {[...Array(skeletonCount)].map((_, i) => (
            <Box
              key={i}
              sx={{
                py: 1.5,
                px: 2,
                borderBottom:
                  i < skeletonCount - 1 ? `1px solid ${colors.border}` : "none",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    flex: 1,
                  }}
                >
                  <Skeleton
                    variant="text"
                    width={60}
                    height={20}
                    sx={{ bgcolor: colors.border }}
                  />
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={20}
                    sx={{ bgcolor: colors.border }}
                  />
                </Box>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 2, bgcolor: colors.card, boxShadow: 0 }}>
      <CardContent sx={{ p: 0 }}>
        {items.map((item, index) => (
          <Box
            key={item.id}
            onClick={() => onSelect(item.id)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1.5,
              px: 2,
              borderBottom:
                index < items.length - 1
                  ? `1px solid ${colors.border}`
                  : "none",
              cursor: "pointer",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}
            >
              {item.subtitle ? (
                <>
                  <Typography
                    sx={{
                      color: colors.textSecondary,
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      minWidth: 50,
                    }}
                  >
                    {item.id}
                  </Typography>
                  <Typography
                    sx={{
                      color: colors.text,
                      fontSize: "0.95rem",
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </Typography>
                </>
              ) : (
                <Typography
                  sx={{
                    color: colors.text,
                    fontSize: "0.95rem",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </Typography>
              )}
            </Box>
            {selectedId === item.id && (
              <Check
                sx={{
                  color: colors.primary,
                  fontSize: "1.1rem",
                }}
              />
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};
