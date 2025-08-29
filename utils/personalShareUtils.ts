import { Expense, ExpenseShare } from "./types";

export interface PersonalShareData {
  amount: number;
  isPersonalShare: boolean;
  originalAmount: number;
  userShare?: ExpenseShare; // Keep this for backward compatibility, but it represents a single share
}

export const getPersonalAmount = (
  expense: Expense,
  isPersonalView: boolean,
  userId?: string | number
): PersonalShareData => {
  if (
    !isPersonalView ||
    !expense.shares ||
    !Array.isArray(expense.shares) ||
    !userId
  ) {
    return {
      amount: expense.amount,
      isPersonalShare: false,
      originalAmount: expense.amount,
      userShare: undefined,
    };
  }

  const share = expense.shares?.find((s: ExpenseShare) => {
    const shareUserId =
      typeof s.user_id === "string" ? parseInt(s.user_id) : s.user_id;
    const currentUserId =
      typeof userId === "string" ? parseInt(userId) : userId;
    return shareUserId === currentUserId;
  });

  if (share) {
    return {
      amount: share.share_amount,
      isPersonalShare: true,
      originalAmount: expense.amount,
      userShare: share,
    };
  }

  return {
    amount: expense.amount,
    isPersonalShare: false,
    originalAmount: expense.amount,
    userShare: undefined,
  };
};
