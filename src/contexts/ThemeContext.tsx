import React, { createContext, useContext, useEffect, useState } from "react";

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

interface ThemeContextType {
  theme: TelegramTheme;
  isDark: boolean;
  colors: {
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
  };
  fontFamily: string;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values instead of throwing error
    return {
      theme: {},
      isDark: false,
      colors: {
        background: "#f3f6fa",
        surface: "#ffffff",
        text: "#111827",
        textSecondary: "#64748b",
        primary: "#2563eb",
        accent: "#3390ec",
        border: "#dde6f2",
        card: "#ffffff",
        income: "#22c55e",
        incomeBg: "#dbfbe7",
        expense: "#ef4444",
        expenseBg: "#fde1e1",
        incomeExpenseCard: "#f8fafc",
        cardBg: "#eaf2fe",
      },
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
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
      } else {
        if (manualTheme === "auto") {
          setIsDark(false);
        }
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

  const getColors = () => {
    if (manualTheme === "dark") {
      return {
        background: "#0f172a",
        surface: "#1e293b",
        text: "#f8fafc",
        textSecondary: "#94a3b8",
        primary: "#3b82f6",
        accent: "#60a5fa",
        border: "#334155",
        card: "#1e293b",
        income: "#22c55e",
        incomeBg: "#1a3a1a",
        expense: "#ef4444",
        expenseBg: "#3a1a1a",
        incomeExpenseCard: "#283442",
        cardBg: "#1e2a38",
      };
    }
    if (manualTheme === "light") {
      return {
        background: "#f3f6fa",
        surface: "#ffffff",
        text: "#111827",
        textSecondary: "#64748b",
        primary: "#2563eb",
        accent: "#3390ec",
        border: "#dde6f2",
        card: "#ffffff",
        income: "#22c55e",
        incomeBg: "#dbfbe7",
        expense: "#ef4444",
        expenseBg: "#fde1e1",
        incomeExpenseCard: "#f8fafc",
        cardBg: "#eaf2fe",
      };
    }
    if (Object.keys(theme).length === 0) {
      return {
        background: "#f3f6fa",
        surface: "#ffffff",
        text: "#111827",
        textSecondary: "#64748b",
        primary: "#2563eb",
        accent: "#3390ec",
        border: "#dde6f2",
        card: "#ffffff",
        income: "#22c55e",
        incomeBg: "#dbfbe7",
        expense: "#ef4444",
        expenseBg: "#fde1e1",
        incomeExpenseCard: "#f8fafc",
        cardBg: "#eaf2fe",
      };
    }
    return {
      background: theme.bg_color || "#f3f6fa",
      surface: theme.secondary_bg_color || theme.section_bg_color || "#ffffff",
      text: theme.text_color || "#111827",
      textSecondary: theme.subtitle_text_color || theme.hint_color || "#64748b",
      primary: theme.accent_text_color || theme.link_color || "#2563eb",
      accent: theme.button_color || theme.link_color || "#3390ec",
      border: theme.section_separator_color || "#dde6f2",
      card: theme.secondary_bg_color || theme.section_bg_color || "#ffffff",
      income: "#22c55e",
      incomeBg: isDark ? "#1a3a1a" : "#dbfbe7",
      expense: "#ef4444",
      expenseBg: isDark ? "#3a1a1a" : "#fde1e1",
      incomeExpenseCard: isDark ? "#283442" : "#f8fafc",
      cardBg: isDark ? "#1e2a38" : "#eaf2fe",
    };
  };

  const contextValue = {
    theme,
    isDark,
    colors: getColors(),
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    toggleTheme,
  };

  useEffect(() => {
    if (!mounted) return;
    let bgColor = contextValue.colors.background;
    if (
      typeof window !== "undefined" &&
      window.Telegram?.WebApp?.themeParams?.bg_color
    ) {
      bgColor = window.Telegram.WebApp.themeParams.bg_color;
    }
    if (typeof document !== "undefined") {
      document.body.style.backgroundColor = bgColor;
      document.body.style.color = contextValue.colors.text;
    }
  }, [
    manualTheme,
    isDark,
    theme,
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
