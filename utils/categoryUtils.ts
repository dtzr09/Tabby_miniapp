import { UnifiedEntry } from "./types";

// Regex for matching emoji characters
const EMOJI_REGEX =
  /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]\s*/u;

/**
 * Removes emoji from the start of a category name and trims whitespace
 */
export const cleanCategoryName = (
  categoryName: string
): {
  name: string;
  raw_name: string;
} => {
  // First trim any leading/trailing whitespace from the original string
  const trimmedCategory = categoryName.trim();

  // Then remove emoji and trim again to handle any space that was after the emoji
  const cleanedName = trimmedCategory.replace(EMOJI_REGEX, "").trim();

  // Return the cleaned name or "Other" if empty
  return {
    name: cleanedName || "Other",
    raw_name: trimmedCategory,
  };
};

/**
 * Gets unique categories from an array of entries
 */
export const getUniqueCategories = (
  entries: UnifiedEntry[]
): { name: string; raw_name: string }[] => {
  // Create a map to store unique categories with both clean and raw names
  const categoryMap = new Map<string, { name: string; raw_name: string }>();

  entries.forEach((entry) => {
    const rawName = entry.category || "Other";
    const cleanedCategory = cleanCategoryName(rawName);
    
    // Use the cleaned name as the key to ensure uniqueness
    if (!categoryMap.has(cleanedCategory.name)) {
      categoryMap.set(cleanedCategory.name, {
        name: cleanedCategory.name,
        raw_name: rawName
      });
    }
  });

  // Convert map to array and sort by clean name
  return Array.from(categoryMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
};
