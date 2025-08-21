import { Expense, ExpenseShare } from "./types";

// Helper function to extract personal expenses from group view with user's share amounts
export const getPersonalExpensesFromGroup = (
  expenses: Expense[],
  userId: number
) => {
  if (!expenses || !Array.isArray(expenses)) {
    return [];
  }

  if (!userId) {
    return [];
  }

  const userIdNum = typeof userId === "string" ? parseInt(userId) : userId;

  if (isNaN(userIdNum)) {
    return [];
  }

  return expenses
    .filter((expense) => {
      // Check if expense has shares
      if (!expense.shares || !Array.isArray(expense.shares)) {
        return false;
      }

      // Check if user has a share in the expense
      return expense.shares?.some((share: ExpenseShare) => {
        if (!share || typeof share.user_id === "undefined") {
          return false;
        }

        const shareUserId =
          typeof share.user_id === "string"
            ? parseInt(share.user_id)
            : share.user_id;

        return shareUserId === userIdNum;
      });
    })
    .map((expense) => {
      // Find the user's share for this expense
      const userShare = expense.shares?.find((share: ExpenseShare) => {
        const shareUserId =
          typeof share.user_id === "string"
            ? parseInt(share.user_id)
            : share.user_id;
        return shareUserId === userIdNum;
      });

      // Return the expense with the user's share amount
      return {
        ...expense,
        amount: userShare?.share_amount || 0, // Use the user's share amount instead of total
        original_amount: expense.amount, // Keep the original total amount for reference
        user_share: userShare, // Include the full share object
      };
    });
};
