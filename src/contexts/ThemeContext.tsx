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
  error: string;
}

interface ThemeContextType {
  theme: TelegramTheme;
  isDark: boolean;
  colors: ColorScheme;
  fontFamily: string;
  toggleTheme: () => void;
  currentTheme: "light" | "dark" | "auto";
  setTheme: (theme: "light" | "dark" | "auto") => void;
}

// Helper functions - Always use fixed themes based on light/dark mode
const getThemeColors = (
  isDark: boolean,
  theme: TelegramTheme,
  manualTheme: "light" | "dark" | "auto"
): ColorScheme => {
  // Determine the theme mode to use
  let themeMode: "light" | "dark";
  
  if (manualTheme === "light" || manualTheme === "dark") {
    // Use manual theme selection
    themeMode = manualTheme;
  } else {
    // Use detected light/dark mode (auto mode)
    themeMode = isDark ? "dark" : "light";
  }
  
  // Always use our fixed color palette based on the theme mode
  const palette = COLORS[themeMode];
  
  return {
    background: themeMode === "dark" ? palette.primary[100] : palette.primary[50],
    surface: palette.surface.main,
    text: themeMode === "dark" ? palette.primary[900] : palette.primary[800],
    textSecondary: themeMode === "dark" ? palette.primary[600] : palette.primary[400],
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
    disabled: themeMode === "dark" ? palette.primary[300] : palette.primary[600],
    inputBg: palette.surface.input,
    error: palette.status.expense,
  };
};

const DEFAULT_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

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
      currentTheme: "auto" as const,
      setTheme: () => {},
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
  const [manualTheme, setManualTheme] = useState<"light" | "dark" | "auto">(
    "auto"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initializeTheme = () => {
      if (
        typeof window !== "undefined" &&
        window.Telegram?.WebApp?.themeParams
      ) {
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

  const setThemeMode = (newTheme: "light" | "dark" | "auto") => {
    setManualTheme(newTheme);
    if (newTheme === "light") {
      setIsDark(false);
    } else if (newTheme === "dark") {
      setIsDark(true);
    } else {
      // Auto mode - detect from system/Telegram
      if (
        typeof window !== "undefined" &&
        window.Telegram?.WebApp?.themeParams
      ) {
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

  const toggleTheme = () => {
    if (manualTheme === "auto") {
      setThemeMode("dark");
    } else if (manualTheme === "dark") {
      setThemeMode("light");
    } else {
      setThemeMode("auto");
    }
  };

  const contextValue = {
    theme,
    isDark,
    colors: getThemeColors(isDark, theme, manualTheme),
    fontFamily: DEFAULT_FONT_FAMILY,
    toggleTheme,
    currentTheme: manualTheme,
    setTheme: setThemeMode,
  };

  useEffect(() => {
    if (!mounted) return;
    // Always use our fixed theme background color
    const bgColor = contextValue.colors.background;
    if (typeof document !== "undefined") {
      document.body.style.backgroundColor = bgColor;
      document.body.style.color = contextValue.colors.text;
    }
  }, [
    manualTheme,
    isDark,
    mounted,
    contextValue.colors.background,
    contextValue.colors.text,
  ]);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
