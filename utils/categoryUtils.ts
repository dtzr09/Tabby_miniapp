import { UnifiedEntry } from "./types";

// Comprehensive regex for matching emoji characters including variation selectors
const EMOJI_REGEX =
  /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}]+\s*/u;

/**
 * Removes emoji from the start of a category name and trims whitespace
 */
export const cleanCategoryName = (
  categoryName: string
): {
  name: string;
  raw_name: string;
  emoji: string;
} => {
  // First trim any leading/trailing whitespace from the original string
  const trimmedCategory = categoryName.trim();
  
  // More aggressive cleaning: remove any leading non-letter characters and whitespace
  let cleanedName = trimmedCategory;
  
  // Remove emoji using the regex
  const emojiMatch = trimmedCategory.match(EMOJI_REGEX);
  const emoji = emojiMatch?.[0]?.trim() || "🏷️";
  
  if (emojiMatch) {
    cleanedName = trimmedCategory.replace(EMOJI_REGEX, "").trim();
  }
  
  // Additional cleanup: remove any remaining leading non-alphanumeric characters
  cleanedName = cleanedName.replace(/^[^\w\s]+\s*/, "").trim();
  
  // Remove any invisible characters or zero-width characters
  cleanedName = cleanedName.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

  // Return the cleaned name or "Other" if empty
  return {
    name: cleanedName || "Other",
    raw_name: trimmedCategory,
    emoji,
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
    const rawName = entry.category?.name || "Other";
    const cleanedCategory = cleanCategoryName(rawName);

    // Use the cleaned name as the key to ensure uniqueness
    if (!categoryMap.has(cleanedCategory.name)) {
      categoryMap.set(cleanedCategory.name, {
        name: cleanedCategory.name,
        raw_name: rawName,
      });
    }
  });

  // Convert map to array and sort by clean name
  return Array.from(categoryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};
