import { CATEGORY_COLOR_PALETTE } from "./categoryColors";
import { getFilteredExpenses } from "./getFilteredExpenses";
import { Budget, Expense } from "./types";

export const getCategoryData = (
  expenses: Expense[],
  budgets: Budget[],
  period: "daily" | "weekly" | "monthly"
) => {
  const filteredExpenses = getFilteredExpenses(expenses, period);
  const categoryMap = new Map<
    string,
    { name: string; spent: number; emoji: string; budget: number }
  >();

  // First, add all budgets to the map (if any exist)
  if (budgets && budgets.length > 0) {
    budgets.forEach((budget) => {
      // Handle both nested category object and direct category name
      const categoryName = budget.category?.name;
      if (!categoryName) return;

      // Extract emoji from category name (more comprehensive emoji regex)
      const emojiMatch = categoryName.match(
        /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/u
      );
      const emoji = emojiMatch ? emojiMatch[0] : "⚪";

      // Remove emoji from category name and trim
      const cleanName = categoryName
        .replace(
          /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]\s*/u,
          ""
        )
        .trim();

      categoryMap.set(cleanName, {
        name: cleanName,
        spent: 0, // Will be updated with expenses
        emoji,
        budget: budget.amount || 0,
      });
    });
  }

  // Process all expenses, creating categories for those without budgets
  filteredExpenses.forEach((expense) => {
    const categoryName = expense.category?.name;
    if (!categoryName) return;

    // Extract emoji and clean name as before
    const emojiMatch = categoryName.match(
      /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]/u
    );
    const emoji = emojiMatch ? emojiMatch[0] : "⚪";
    const cleanName = categoryName
      .replace(
        /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}]\s*/u,
        ""
      )
      .trim();

    // Get or create category data
    const categoryData = categoryMap.get(cleanName) || {
      name: cleanName,
      spent: 0,
      emoji,
      budget: 0, // No budget for categories without one
    };

    // Add expense amount
    categoryData.spent += Math.abs(expense.amount || 0);
    categoryMap.set(cleanName, categoryData);
  });

  // Convert map to array and sort by spent amount
  return Array.from(categoryMap.values())
    .sort((a, b) => b.spent - a.spent)
    .map((cat, index) => ({
      id: `category-${index}`,
      name: cat.name,
      icon: <span>{cat.emoji}</span>,
      budget: cat.budget,
      spent: cat.spent,
      color: CATEGORY_COLOR_PALETTE[index % 24],
    }));
};
