// Category color palettes optimized for light and dark themes
// Light theme background: #f3f6fa (very light blue-gray)
// Dark theme background: #0f172a (very dark blue-gray)

export const CATEGORY_COLORS = {
  light: [
    "#b45309", // Amber 800 - Deep golden brown
    "#450a0a", // Red 950 - Very dark red
    "#1e1b4b", // Indigo 900 - Navy blue
    "#365314", // Lime 800 - Dark olive
    "#581c87", // Purple 800 - Deep royal purple
    "#701a75", // Fuchsia 900 - Deep magenta
    "#0c4a6e", // Sky 800 - Deep ocean blue
    "#991b1b", // Red 800 - Dark crimson
    "#0f766e", // Teal 700 - Deep teal
    "#713f12", // Amber 900 - Dark bronze
    "#3730a3", // Indigo 700 - Royal indigo
    "#a21caf", // Fuchsia 700 - Bright magenta
    "#164e63", // Cyan 900 - Dark turquoise
    "#5b21b6", // Violet 800 - Deep violet
    "#b91c1c", // Red 700 - Deep red
    "#0369a1", // Sky 700 - Medium sky blue
  ],
  dark: [
    "#fbbf24", // Amber 400 - Light golden
    "#fca5a5", // Red 300 - Light coral
    "#a5b4fc", // Indigo 300 - Light periwinkle
    "#bef264", // Lime 300 - Light lime
    "#d8b4fe", // Purple 300 - Light lavender
    "#f0abfc", // Fuchsia 300 - Light pink
    "#7dd3fc", // Sky 300 - Light sky
    "#fda4af", // Rose 300 - Light rose
    "#5eead4", // Teal 300 - Light aqua
    "#fed7aa", // Orange 200 - Cream orange
    "#c7d2fe", // Indigo 200 - Very light indigo
    "#fce7f3", // Pink 200 - Very light pink
    "#a7f3d0", // Emerald 200 - Very light mint
    "#ddd6fe", // Violet 200 - Very light purple
    "#fecaca", // Red 200 - Very light pink-red
    "#bae6fd", // Sky 200 - Very light blue
  ],
};

// Legacy export for backward compatibility
export const CATEGORY_COLOR_PALETTE = CATEGORY_COLORS.light;

// Standardized colors for common static categories
const STANDARD_CATEGORY_COLORS = {
  light: {
    Food: "#0d9488", // Teal 600 - Rich teal for food
    Transport: "#ca8a04", // Yellow 600 - Golden for transport
    Groceries: "#7c3aed", // Violet 600 - Rich purple for groceries
    Utilities: "#2563eb", // Blue 600 - Classic blue for utilities
    Entertainment: "#dc2626", // Red 600 - Warm red for entertainment
    Shopping: "#be185d", // Pink 600 - Deep pink for shopping
    Bills: "#92400e", // Amber 700 - Deep amber for bills
    Health: "#7c2d12", // Orange 900 - Brown orange for health
    Insurance: "#0284c7", // Sky 600 - Sky blue for insurance
    Miscellaneous: "#64748b", // Slate 500 - Neutral for miscellaneous
    Flexible: "#86198f", // Fuchsia 800 - Deep fuchsia for flexible
    Salary: "#059669", // Emerald 600 - Rich green for salary
    Bonus: "#ca8a04", // Yellow 600 - Golden for bonus
    Investment: "#7c3aed", // Violet 600 - Rich purple for investment
    Dividends: "#be185d", // Pink 600 - Deep pink for dividends
  },
  dark: {
    Food: "#2dd4bf", // Teal 400 - Bright teal for food
    Transport: "#fbbf24", // Amber 400 - Light amber for transport
    Groceries: "#a78bfa", // Violet 400 - Medium violet for groceries
    Utilities: "#60a5fa", // Blue 400 - Light blue for utilities
    Entertainment: "#f87171", // Red 400 - Soft red for entertainment
    Shopping: "#f472b6", // Pink 400 - Light pink for shopping
    Bills: "#fcd34d", // Amber 300 - Light amber for bills
    Health: "#fed7aa", // Orange 200 - Very light orange for health
    Insurance: "#38bdf8", // Sky 400 - Light sky blue for insurance
    Miscellaneous: "#94a3b8", // Slate 400 - Neutral for miscellaneous
    Flexible: "#f9a8d4", // Pink 300 - Very light pink for flexible
    Salary: "#34d399", // Emerald 400 - Light emerald for salary
    Bonus: "#fbbf24", // Amber 400 - Light amber for bonus
    Investment: "#a78bfa", // Violet 400 - Medium violet for investment
    Dividends: "#f472b6", // Pink 400 - Light pink for dividends
  },
};

// Helper function to get colors based on theme
export const getCategoryColors = (isDark: boolean): string[] => {
  return isDark ? CATEGORY_COLORS.dark : CATEGORY_COLORS.light;
};

export const getCategoryColor = (
  categoryName: string,
  isDark: boolean = false
): string => {
  // First, check if this is a standard category with a predefined color
  const standardColors = isDark
    ? STANDARD_CATEGORY_COLORS.dark
    : STANDARD_CATEGORY_COLORS.light;

  if (standardColors[categoryName as keyof typeof standardColors]) {
    return standardColors[categoryName as keyof typeof standardColors];
  }

  // For non-standard categories, use the hash-based approach for consistency
  const hash = categoryName.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const colors = getCategoryColors(isDark);
  return colors[Math.abs(hash) % colors.length];
};
