export interface PersonalShareData {
  amount: number;
  isPersonalShare: boolean;
  originalAmount: number;
  userShare?: { user_id: string | number; share_amount: number };
}

export const getPersonalAmount = (
  expense: any,
  isPersonalView: boolean,
  userId?: string | number
): PersonalShareData => {
  if (!isPersonalView || !expense.shares || !Array.isArray(expense.shares) || !userId) {
    return { 
      amount: expense.amount, 
      isPersonalShare: false, 
      originalAmount: expense.amount, 
      userShare: undefined 
    };
  }

  const share = expense.shares.find((s: any) => {
    const shareUserId = typeof s.user_id === "string" ? parseInt(s.user_id) : s.user_id;
    const currentUserId = typeof userId === "string" ? parseInt(userId) : userId;
    return shareUserId === currentUserId;
  });

  if (share) {
    return {
      amount: share.share_amount,
      isPersonalShare: true,
      originalAmount: expense.amount,
      userShare: share
    };
  }

  return { 
    amount: expense.amount, 
    isPersonalShare: false, 
    originalAmount: expense.amount, 
    userShare: undefined 
  };
};