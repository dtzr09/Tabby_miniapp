// Color palette that matches getCategoryData
export const CATEGORY_COLOR_PALETTE = [
  "#4CAF50", // Green
  "#FF9800", // Orange
  "#2196F3", // Blue
  "#9C27B0", // Purple
  "#F44336", // Red
  "#00BCD4", // Cyan
  "#FF5722", // Deep Orange
  "#3F51B5", // Indigo
  "#009688", // Teal
  "#E91E63", // Pink
  "#8BC34A", // Light Green
  "#673AB7", // Deep Purple
  "#FFC107", // Amber
  "#03A9F4", // Light Blue
  "#795548", // Brown
  "#607D8B", // Blue Grey
  "#CDDC39", // Lime
  "#FF4081", // Pink Accent
  "#00E676", // Green Accent
  "#64FFDA", // Teal Accent
  "#40C4FF", // Light Blue Accent
  "#536DFE", // Indigo Accent
  "#FF5252", // Red Accent
  "#FFD740", // Amber Accent
];

export const getCategoryColor = (categoryName: string): string => {
  // Create a simple hash of the category name to ensure consistent colors
  const hash = categoryName.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return CATEGORY_COLOR_PALETTE[Math.abs(hash) % CATEGORY_COLOR_PALETTE.length];
};
