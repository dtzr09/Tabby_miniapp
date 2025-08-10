import React, { createContext, useContext, useEffect, useState } from "react";

// Color palette definitions
const COLORS = {
  light: {
    primary: {
      50: "#f3f6fa",
      100: "#e2e8f0",
      200: "#cbd5e1",
      300: "#94a3b8",
      400: "#64748b",
      500: "#475569",
      600: "#334155",
      700: "#1e293b",
      800: "#0f172a",
      900: "#020617",
    },
    accent: {
      blue: "#2563eb",
      lightBlue: "#3390ec",
      darkBlue: "#1d4ed8",
    },
    status: {
      income: "#22c55e",
      incomeBg: "#dbfbe7",
      expense: "#ef4444",
      expenseBg: "#fde1e1",
    },
    surface: {
      main: "#ffffff",
      secondary: "#f8fafc",
      card: "#ffffff",
      cardBg: "#eaf2fe",
      incomeExpenseCard: "#f8fafc",
      border: "#dde6f2",
      input: "#f8fafc",
    },
  },
  dark: {
    primary: {
      50: "#020617",
      100: "#0f172a",
      200: "#1e293b",
      300: "#334155",
      400: "#475569",
      500: "#64748b",
      600: "#94a3b8",
      700: "#cbd5e1",
      800: "#e2e8f0",
      900: "#f3f6fa",
    },
    accent: {
      blue: "#3b82f6",
      lightBlue: "#60a5fa",
      darkBlue: "#2563eb",
    },
    status: {
      income: "#22c55e",
      incomeBg: "#1a3a1a",
      expense: "#ef4444",
      expenseBg: "#3a1a1a",
    },
    surface: {
      main: "#1e293b",
      secondary: "#283442",
      card: "#1e293b",
      cardBg: "#1e2a38",
      incomeExpenseCard: "#283442",
      border: "#334155",
      input: "#4a5e80",
    },
  },
};

// Type definitions
interface TelegramTheme {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  accent_text_color?: string;
  destructive_text_color?: string;
  header_bg_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  section_separator_color?: string;
  subtitle_text_color?: string;
  bottom_bar_bg_color?: string;
}

interface TelegramWebApp {
  themeParams?: TelegramTheme;
  onEvent?: (eventType: string, eventHandler: () => void) => void;
}

interface ColorScheme {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  border: string;
  card: string;
  income: string;
  incomeBg: string;
  expense: string;
  expenseBg: string;
  incomeExpenseCard: string;
  cardBg: string;
  disabled: string;
  inputBg: string;
}

interface ThemeContextType {
  theme: TelegramTheme;
  isDark: boolean;
  colors: ColorScheme;
  fontFamily: string;
  toggleTheme: () => void;
}

// Helper functions
const getThemeColors = (isDark: boolean, theme: TelegramTheme, manualTheme: "light" | "dark" | "auto"): ColorScheme => {
  // If manual theme is set, use those colors
  if (manualTheme === "dark" || manualTheme === "light") {
    const palette = COLORS[manualTheme];
    return {
      background: manualTheme === "dark" ? palette.primary[100] : palette.primary[50],
      surface: palette.surface.main,
      text: manualTheme === "dark" ? palette.primary[900] : palette.primary[800],
      textSecondary: manualTheme === "dark" ? palette.primary[600] : palette.primary[400],
      primary: palette.accent.blue,
      accent: palette.accent.lightBlue,
      border: palette.surface.border,
      card: palette.surface.card,
      income: palette.status.income,
      incomeBg: palette.status.incomeBg,
      expense: palette.status.expense,
      expenseBg: palette.status.expenseBg,
      incomeExpenseCard: palette.surface.incomeExpenseCard,
      cardBg: palette.surface.cardBg,
      disabled: palette.primary[600],
      inputBg: palette.surface.input,
    };
  }

  // If no theme or auto theme, use Telegram theme or fallback
  return {
    background: theme.bg_color || COLORS.light.primary[50],
    surface: isDark
      ? theme.secondary_bg_color || theme.section_bg_color || COLORS.dark.surface.main
      : COLORS.light.surface.secondary,
    text: theme.text_color || (isDark ? COLORS.dark.primary[900] : COLORS.light.primary[800]),
    textSecondary: theme.subtitle_text_color || theme.hint_color || (isDark ? COLORS.dark.primary[500] : COLORS.light.primary[400]),
    primary: theme.accent_text_color || theme.link_color || COLORS.light.accent.blue,
    accent: theme.button_color || theme.link_color || COLORS.light.accent.lightBlue,
    border: theme.section_separator_color || COLORS.light.surface.border,
    card: theme.secondary_bg_color || theme.section_bg_color || COLORS.light.surface.card,
    income: COLORS.light.status.income,
    incomeBg: isDark ? COLORS.dark.status.incomeBg : COLORS.light.status.incomeBg,
    expense: COLORS.light.status.expense,
    expenseBg: isDark ? COLORS.dark.status.expenseBg : COLORS.light.status.expenseBg,
    incomeExpenseCard: isDark ? COLORS.dark.surface.incomeExpenseCard : COLORS.light.surface.incomeExpenseCard,
    cardBg: isDark ? COLORS.dark.surface.cardBg : COLORS.light.surface.cardBg,
    disabled: isDark ? COLORS.dark.primary[300] : COLORS.light.primary[600],
    inputBg: isDark ? COLORS.dark.surface.input : COLORS.light.surface.input,
  };
};

const DEFAULT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values instead of throwing error
    return {
      theme: {},
      isDark: false,
      colors: getThemeColors(false, {}, "light"),
      fontFamily: DEFAULT_FONT_FAMILY,
      toggleTheme: () => {},
    };
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<TelegramTheme>({});
  const [isDark, setIsDark] = useState(false);
  const [manualTheme, setManualTheme] = useState<"light" | "dark" | "auto">("auto");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initializeTheme = () => {
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.themeParams) {
        const telegramTheme = window.Telegram.WebApp.themeParams;
        setTheme(telegramTheme);
        if (manualTheme === "auto") {
          const bgColor = telegramTheme.bg_color || "#ffffff";
          const isDarkMode =
            bgColor.toLowerCase() !== "#ffffff" &&
            bgColor.toLowerCase() !== "#f3f6fa" &&
            bgColor.toLowerCase() !== "#f8fafc";
          setIsDark(isDarkMode);
        }
      } else if (manualTheme === "auto") {
        setIsDark(false);
      }
    };

    initializeTheme();

    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp as TelegramWebApp;
      if (tg.onEvent) {
        tg.onEvent("themeChanged", initializeTheme);
      }
    }
  }, [manualTheme, mounted]);

  const toggleTheme = () => {
    if (manualTheme === "auto") {
      setManualTheme("dark");
      setIsDark(true);
    } else if (manualTheme === "dark") {
      setManualTheme("light");
      setIsDark(false);
    } else {
      setManualTheme("auto");
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.themeParams) {
        const telegramTheme = window.Telegram.WebApp.themeParams;
        const bgColor = telegramTheme.bg_color || "#ffffff";
        const isDarkMode =
          bgColor.toLowerCase() !== "#ffffff" &&
          bgColor.toLowerCase() !== "#f3f6fa" &&
          bgColor.toLowerCase() !== "#f8fafc";
        setIsDark(isDarkMode);
      } else {
        setIsDark(false);
      }
    }
  };

  const contextValue = {
    theme,
    isDark,
    colors: getThemeColors(isDark, theme, manualTheme),
    fontFamily: DEFAULT_FONT_FAMILY,
    toggleTheme,
  };

  useEffect(() => {
    if (!mounted) return;
    let bgColor = contextValue.colors.background;
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.themeParams?.bg_color) {
      bgColor = window.Telegram.WebApp.themeParams.bg_color;
    }
    if (typeof document !== "undefined") {
      document.body.style.backgroundColor = bgColor;
      document.body.style.color = contextValue.colors.text;
    }
  }, [manualTheme, isDark, theme, mounted, contextValue.colors.background, contextValue.colors.text]);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
