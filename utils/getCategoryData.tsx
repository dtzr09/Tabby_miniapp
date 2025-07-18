import { getFilteredExpenses } from "./getFilteredExpenses";
import { Budget, Expense } from "../components/dashboard";

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

  // First, add all budgets to the map
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

  // Then, add expenses to the map
  filteredExpenses.forEach((exp) => {
    // Handle both nested category object and direct category name
    const categoryName = exp.category?.name || "Other";

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

    if (categoryMap.has(cleanName)) {
      categoryMap.get(cleanName)!.spent += Math.abs(exp.amount);
    } else {
      categoryMap.set(cleanName, {
        name: cleanName,
        spent: Math.abs(exp.amount),
        emoji,
        budget: 0, // No budget set for this category
      });
    }
  });

  return Array.from(categoryMap.values()).map((cat, index) => ({
    id: `category-${index}`,
    name: cat.name,
    icon: <span>{cat.emoji}</span>,
    budget: cat.budget,
    spent: cat.spent,
    color: ["#4CAF50", "#FF9800", "#2196F3", "#9C27B0", "#F44336", "#00BCD4"][
      index % 6
    ],
  }));
};
