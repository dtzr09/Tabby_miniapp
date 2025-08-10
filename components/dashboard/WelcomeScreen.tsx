import {
  Box,
  Typography,
  Card,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
} from "@mui/material";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { alpha } from "@mui/material/styles";

export default function WelcomeScreen() {
  const { colors } = useTheme();

  const handleOpenBot = () => {
    // Open Telegram bot in a new tab
    window.open("https://t.me/tabbyfinancebot", "_blank");
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          textAlign: "center",
          px: 2,
        }}
      >
        <Box
          sx={{
            width: 70,
            height: 70,
            position: "relative",
          }}
        >
          <Image
            src="/images/tabby_icon.png"
            alt="ExpenseTracker Logo"
            fill
            style={{ objectFit: "contain" }}
          />
        </Box>

        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "1.3rem", sm: "1.75rem" },
            fontWeight: 700,
            color: colors.text,
            mb: 0.5,
          }}
        >
          Welcome to Tabby
        </Typography>

        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: "0.875rem", sm: "1rem" },
            color: alpha(colors.text, 0.7),
            fontWeight: 500,
            mb: 3,
          }}
        >
          Start tracking your expenses with Tabby
        </Typography>

        <Card
          sx={{
            maxWidth: "sm",
            width: "100%",
            bgcolor: colors.card,
            borderRadius: 2,
            p: 2,
            mb: 2,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontSize: "1rem",
              fontWeight: 600,
              color: colors.text,
              mb: 1.5,
            }}
          >
            Get Started
          </Typography>

          <List sx={{ mb: 2 }}>
            {[
              "Open the Tabby bot in Telegram",
              "Send the command /start",
              "Begin tracking your expenses and managing your budget",
            ].map((text, index) => (
              <ListItem
                key={index}
                dense
                sx={{
                  py: 0.25,
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      bgcolor: colors.primary,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  primaryTypographyProps={{
                    sx: {
                      color: colors.text,
                      fontSize: "0.875rem",
                      ...(text.includes("/start") && {
                        "& span": {
                          bgcolor: alpha(colors.text, 0.1),
                          px: 0.75,
                          py: 0.125,
                          borderRadius: 0.75,
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                        },
                      }),
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>

          <Button
            variant="contained"
            fullWidth
            onClick={handleOpenBot}
            sx={{
              bgcolor: colors.primary,
              color: "#fff",
              py: 1,
              fontSize: "0.875rem",
              borderRadius: 1.5,
              textTransform: "none",
              "&:hover": {
                bgcolor: alpha(colors.primary, 0.9),
              },
            }}
          >
            Open Tabby
          </Button>
        </Card>

        <Typography
          sx={{
            color: alpha(colors.text, 0.6),
            fontSize: "0.75rem",
          }}
        >
          Your data will appear here once you start using Tabby
        </Typography>
      </Box>
    </Container>
  );
}
