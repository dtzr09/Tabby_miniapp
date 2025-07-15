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

const DASHBOARD_BG = "#f3f6fa";
const CARD_BG = "#fff";
const CARD_BORDER = "1.5px solid #dde6f2";
const INPUT_BG = "#f8fafc";
const TELEGRAM_BLUE = "#3390ec";

export default function AdvancedSearch() {
  const router = useRouter();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: DASHBOARD_BG,
        color: "#222",
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
        <IconButton sx={{ color: "#222" }} onClick={() => router.push("/")}>
          <ArrowBackIosNewIcon />
        </IconButton>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 22,
            flex: 1,
            textAlign: "center",
            color: "#111827",
          }}
        >
          Tabby
        </Typography>
        <Box>
          <IconButton sx={{ color: "#222" }}>
            <MoreVertIcon />
          </IconButton>
          <IconButton sx={{ color: "#222" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      {/* Search/Filter Controls */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          px: 2,
          mt: 1,
        }}
      >
        <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
          <InputBase
            placeholder="Search"
            sx={{
              bgcolor: INPUT_BG,
              borderRadius: 2,
              px: 2,
              py: 1.2,
              color: "#222",
              flex: 1,
              fontSize: 16,
              border: CARD_BORDER,
            }}
            inputProps={{ "aria-label": "search" }}
          />
          <FormControl sx={{ minWidth: 90 }}>
            <Select
              value={"Owner"}
              sx={{
                bgcolor: INPUT_BG,
                color: "#222",
                borderRadius: 2,
                fontSize: 16,
                py: 1.2,
                px: 1,
                height: 44,
                border: CARD_BORDER,
              }}
              displayEmpty
              inputProps={{ "aria-label": "Owner" }}
            >
              <MenuItem value={"Owner"}>Owner</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
          <FormControl sx={{ minWidth: 90, flex: 1 }}>
            <Select
              value={"Type"}
              sx={{
                bgcolor: INPUT_BG,
                color: "#222",
                borderRadius: 2,
                fontSize: 16,
                py: 1.2,
                px: 1,
                height: 44,
                border: CARD_BORDER,
              }}
              displayEmpty
              inputProps={{ "aria-label": "Type" }}
            >
              <MenuItem value={"Type"}>Type</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 90, flex: 1 }}>
            <Select
              value={"Category"}
              sx={{
                bgcolor: INPUT_BG,
                color: "#222",
                borderRadius: 2,
                fontSize: 16,
                py: 1.2,
                px: 1,
                height: 44,
                border: CARD_BORDER,
              }}
              displayEmpty
              inputProps={{ "aria-label": "Category" }}
            >
              <MenuItem value={"Category"}>Category</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 90, flex: 1 }}>
            <Select
              value={"Currency"}
              sx={{
                bgcolor: INPUT_BG,
                color: "#222",
                borderRadius: 2,
                fontSize: 16,
                py: 1.2,
                px: 1,
                height: 44,
                border: CARD_BORDER,
              }}
              displayEmpty
              inputProps={{ "aria-label": "Currency" }}
            >
              <MenuItem value={"Currency"}>Currency</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <InputBase
            placeholder="Choose a period"
            sx={{
              bgcolor: INPUT_BG,
              borderRadius: 2,
              px: 2,
              py: 1.2,
              color: "#222",
              flex: 1,
              fontSize: 16,
              border: CARD_BORDER,
            }}
            inputProps={{ "aria-label": "period" }}
          />
          <Button
            sx={{
              color: TELEGRAM_BLUE,
              fontWeight: 700,
              fontSize: 16,
              textTransform: "none",
              minWidth: 0,
              px: 1.5,
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>
      {/* Premium Feature Card */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          px: 2,
          mt: 3,
        }}
      >
        <Card
          sx={{
            bgcolor: CARD_BG,
            border: CARD_BORDER,
            borderRadius: 3,
            boxShadow: 0,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            sx={{
              color: "#222",
              fontSize: 20,
              fontWeight: 500,
              mb: 3,
              textAlign: "center",
            }}
          >
            Advanced search is a premium feature.
          </Typography>
          <Button
            variant="contained"
            sx={{
              bgcolor: TELEGRAM_BLUE,
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
              borderRadius: 2,
              textTransform: "none",
              boxShadow: 0,
              px: 5,
              py: 1.5,
              "&:hover": { bgcolor: "#2776c5" },
            }}
          >
            Subscription
          </Button>
        </Card>
      </Box>
      {/* Footer */}
      <Box sx={{ flex: 1 }} />
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          pb: 3,
          color: TELEGRAM_BLUE,
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        Tabby © 2025
      </Box>
    </Box>
  );
}
