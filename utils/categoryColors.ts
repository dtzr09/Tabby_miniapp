// Category color palettes optimized for light and dark themes
// Light theme background: #f3f6fa (very light blue-gray)
// Dark theme background: #0f172a (very dark blue-gray)

export const CATEGORY_COLORS = {
  light: [
    "#059669", // Emerald 600 - Rich green
    "#dc2626", // Red 600 - Warm red
    "#2563eb", // Blue 600 - Strong blue
    "#7c3aed", // Violet 600 - Rich darker purple
    "#ea580c", // Orange 600 - Vibrant orange
    "#0284c7", // Sky 600 - Sky blue
    "#be185d", // Pink 600 - Deep pink
    "#4338ca", // Indigo 600 - Deep indigo
    "#65a30d", // Lime 600 - Fresh lime
    "#c2410c", // Orange 700 - Deep orange
    "#0d9488", // Teal 600 - Balanced teal
    "#9333ea", // Purple 600 - Deep purple
    "#ca8a04", // Yellow 600 - Golden yellow
    "#1d4ed8", // Blue 700 - Deep blue
    "#be123c", // Rose 700 - Deep rose
    "#047857", // Emerald 700 - Deep emerald
    "#7c2d12", // Orange 900 - Brown orange
    "#166534", // Green 800 - Forest green
    "#6d28d9", // Violet 700 - Dark purple
    "#92400e", // Amber 700 - Deep amber
    "#155e75", // Cyan 800 - Deep cyan
    "#86198f", // Fuchsia 800 - Deep fuchsia
    "#1e40af", // Blue 700 - Classic blue
    "#15803d", // Green 700 - Rich green
  ],
  dark: [
    "#10b981", // Emerald 500 - Bright emerald
    "#f87171", // Red 400 - Soft red
    "#60a5fa", // Blue 400 - Light blue
    "#a78bfa", // Violet 400 - Medium violet
    "#fb923c", // Orange 400 - Light orange
    "#22d3ee", // Cyan 400 - Bright cyan
    "#f472b6", // Pink 400 - Light pink
    "#818cf8", // Indigo 400 - Light indigo
    "#a3e635", // Lime 400 - Bright lime
    "#fdba74", // Orange 300 - Soft orange
    "#2dd4bf", // Teal 400 - Bright teal
    "#c084fc", // Purple 400 - Medium purple
    "#fbbf24", // Amber 400 - Golden amber
    "#3b82f6", // Blue 500 - Medium blue
    "#fb7185", // Rose 400 - Light rose
    "#34d399", // Emerald 400 - Light emerald
    "#fed7aa", // Orange 200 - Very light orange
    "#86efac", // Green 300 - Light green
    "#e9d5ff", // Violet 200 - Very light violet
    "#fcd34d", // Amber 300 - Light amber
    "#67e8f9", // Cyan 300 - Light cyan
    "#f9a8d4", // Pink 300 - Very light pink
    "#93c5fd", // Blue 300 - Very light blue
    "#bbf7d0", // Green 200 - Very light green
  ],
};

// Legacy export for backward compatibility
export const CATEGORY_COLOR_PALETTE = CATEGORY_COLORS.light;

// Standardized colors for common static categories
const STANDARD_CATEGORY_COLORS = {
  light: {
    "Food": "#0d9488",           // Teal 600 - Rich teal for food
    "Transport": "#ca8a04",      // Yellow 600 - Golden for transport
    "Groceries": "#7c3aed",      // Violet 600 - Rich purple for groceries
    "Utilities": "#2563eb",      // Blue 600 - Classic blue for utilities
    "Entertainment": "#dc2626",  // Red 600 - Warm red for entertainment
    "Shopping": "#be185d",       // Pink 600 - Deep pink for shopping
    "Bills": "#92400e",         // Amber 700 - Deep amber for bills
    "Health": "#7c2d12",         // Orange 900 - Brown orange for health
    "Insurance": "#0284c7",      // Sky 600 - Sky blue for insurance
    "Miscellaneous": "#64748b", // Slate 500 - Neutral for miscellaneous
    "Flexible": "#86198f",       // Fuchsia 800 - Deep fuchsia for flexible
    "Salary": "#059669",         // Emerald 600 - Rich green for salary
    "Bonus": "#ca8a04",          // Yellow 600 - Golden for bonus
    "Investment": "#7c3aed",     // Violet 600 - Rich purple for investment
    "Dividends": "#be185d",      // Pink 600 - Deep pink for dividends
  },
  dark: {
    "Food": "#2dd4bf",           // Teal 400 - Bright teal for food
    "Transport": "#fbbf24",      // Amber 400 - Light amber for transport
    "Groceries": "#a78bfa",      // Violet 400 - Medium violet for groceries
    "Utilities": "#60a5fa",      // Blue 400 - Light blue for utilities
    "Entertainment": "#f87171",  // Red 400 - Soft red for entertainment
    "Shopping": "#f472b6",       // Pink 400 - Light pink for shopping
    "Bills": "#fcd34d",         // Amber 300 - Light amber for bills
    "Health": "#fed7aa",         // Orange 200 - Very light orange for health
    "Insurance": "#38bdf8",      // Sky 400 - Light sky blue for insurance
    "Miscellaneous": "#94a3b8", // Slate 400 - Neutral for miscellaneous
    "Flexible": "#f9a8d4",       // Pink 300 - Very light pink for flexible
    "Salary": "#34d399",         // Emerald 400 - Light emerald for salary
    "Bonus": "#fbbf24",          // Amber 400 - Light amber for bonus
    "Investment": "#a78bfa",     // Violet 400 - Medium violet for investment
    "Dividends": "#f472b6",      // Pink 400 - Light pink for dividends
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
  const standardColors = isDark ? STANDARD_CATEGORY_COLORS.dark : STANDARD_CATEGORY_COLORS.light;
  
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
