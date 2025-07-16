import React from "react";
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Button,
  Card,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/router";
import { useTheme } from "../contexts/ThemeContext";

export default function AdvancedSearch() {
  const router = useRouter();
  const { colors } = useTheme();
  
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: colors.background,
        color: colors.text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 0,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pt: 2,
          pb: 1,
          px: 2,
        }}
      >
        <IconButton sx={{ color: colors.text }} onClick={() => router.push("/")}>
          <ArrowBackIosNewIcon />
        </IconButton>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 22,
            flex: 1,
            textAlign: "center",
            color: colors.text,
          }}
        >
          Tabby
        </Typography>
        <Box>
          <IconButton sx={{ color: colors.text }}>
            <MoreVertIcon />
          </IconButton>
          <IconButton sx={{ color: colors.text }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      {/* Search/Filter Controls */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          px: 2,
          mb: 2,
        }}
      >
        <Card
          sx={{
            bgcolor: colors.card,
            borderRadius: 3,
            boxShadow: 0,
            border: `1.5px solid ${colors.border}`,
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: colors.surface,
              borderRadius: 2,
              px: 2,
              py: 1,
              mb: 2,
            }}
          >
            <InputBase
              placeholder="Search transactions..."
              sx={{
                flex: 1,
                color: colors.text,
                fontSize: 16,
                "& .MuiInputBase-input::placeholder": {
                  color: colors.textSecondary,
                  opacity: 1,
                },
              }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select
                value=""
                displayEmpty
                sx={{
                  bgcolor: colors.surface,
                  color: colors.text,
                  "& .MuiSelect-icon": { color: colors.textSecondary },
                }}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="food">Food</MenuItem>
                <MenuItem value="transport">Transport</MenuItem>
                <MenuItem value="shopping">Shopping</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select
                value=""
                displayEmpty
                sx={{
                  bgcolor: colors.surface,
                  color: colors.text,
                  "& .MuiSelect-icon": { color: colors.textSecondary },
                }}
              >
                <MenuItem value="">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Card>
      </Box>
      {/* Premium Feature Card */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          px: 2,
          mb: 2,
        }}
      >
        <Card
          sx={{
            bgcolor: colors.card,
            borderRadius: 3,
            boxShadow: 0,
            border: `1.5px solid ${colors.border}`,
            p: 3,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 24,
              color: colors.text,
              mb: 1,
            }}
          >
            🔍 Advanced Search
          </Typography>
          <Typography
            sx={{
              color: colors.textSecondary,
              fontSize: 16,
              mb: 3,
            }}
          >
            Unlock powerful search filters, export data, and detailed analytics
          </Typography>
          <Button
            variant="contained"
            sx={{
              bgcolor: colors.accent,
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 2,
              textTransform: "none",
              boxShadow: 0,
              py: 1.5,
              px: 3,
              '&:hover': { bgcolor: colors.primary },
            }}
          >
            Subscribe to Premium
          </Button>
        </Card>
      </Box>
    </Box>
  );
}
