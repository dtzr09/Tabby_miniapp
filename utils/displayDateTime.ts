export const displayDateTime = (entry: { date: string }, noDate?: boolean) => {
  const expenseDate = new Date(entry.date);
  const today = new Date();

  // Check if the expense is from today
  if (expenseDate.toDateString() === today.toDateString()) {
    const time = expenseDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return time;
  }

  // For older expenses, show both date and time
  const date = expenseDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const time = expenseDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return noDate ? time : `${date} • ${time}`;
};
