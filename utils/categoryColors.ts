// Category color palettes optimized for light and dark themes
// Light theme background: #f3f6fa (very light blue-gray)
// Dark theme background: #0f172a (very dark blue-gray)

export const CATEGORY_COLORS = {
  light: [
    "#059669", // Emerald 600 - Rich green
    "#dc2626", // Red 600 - Warm red
    "#2563eb", // Blue 600 - Strong blue
    "#7c3aed", // Violet 600 - Rich purple
    "#ea580c", // Orange 600 - Vibrant orange
    "#0284c7", // Sky 600 - Sky blue
    "#be185d", // Pink 600 - Deep pink
    "#4338ca", // Indigo 600 - Deep indigo
    "#65a30d", // Lime 600 - Fresh lime
    "#c2410c", // Orange 700 - Deep orange
    "#0d9488", // Teal 600 - Balanced teal
    "#9333ea", // Purple 600 - Vibrant purple
    "#ca8a04", // Yellow 600 - Golden yellow
    "#1d4ed8", // Blue 700 - Deep blue
    "#be123c", // Rose 700 - Deep rose
    "#047857", // Emerald 700 - Deep emerald
    "#7c2d12", // Orange 900 - Brown orange
    "#166534", // Green 800 - Forest green
    "#581c87", // Purple 800 - Dark purple
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
    "#a78bfa", // Violet 400 - Light violet
    "#fb923c", // Orange 400 - Light orange
    "#22d3ee", // Cyan 400 - Bright cyan
    "#f472b6", // Pink 400 - Light pink
    "#818cf8", // Indigo 400 - Light indigo
    "#a3e635", // Lime 400 - Bright lime
    "#fdba74", // Orange 300 - Soft orange
    "#2dd4bf", // Teal 400 - Bright teal
    "#c084fc", // Purple 400 - Light purple
    "#fbbf24", // Amber 400 - Golden amber
    "#3b82f6", // Blue 500 - Medium blue
    "#fb7185", // Rose 400 - Light rose
    "#34d399", // Emerald 400 - Light emerald
    "#fed7aa", // Orange 200 - Very light orange
    "#86efac", // Green 300 - Light green
    "#c4b5fd", // Violet 300 - Very light violet
    "#fcd34d", // Amber 300 - Light amber
    "#67e8f9", // Cyan 300 - Light cyan
    "#f9a8d4", // Pink 300 - Very light pink
    "#93c5fd", // Blue 300 - Very light blue
    "#bbf7d0", // Green 200 - Very light green
  ],
};

// Legacy export for backward compatibility
export const CATEGORY_COLOR_PALETTE = CATEGORY_COLORS.light;

// Helper function to get colors based on theme
export const getCategoryColors = (isDark: boolean): string[] => {
  return isDark ? CATEGORY_COLORS.dark : CATEGORY_COLORS.light;
};

export const getCategoryColor = (
  categoryName: string,
  isDark: boolean = false
): string => {
  // Create a simple hash of the category name to ensure consistent colors
  const hash = categoryName.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const colors = getCategoryColors(isDark);
  return colors[Math.abs(hash) % colors.length];
};
