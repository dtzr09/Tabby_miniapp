export const getCurrentMonthInfo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Last day & days in month
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // First day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();

  // Shift so Monday = 0, Sunday = 6
  const offset = (firstDayOfWeek + 6) % 7;

  // Total weeks in month (counting partial weeks at start/end)
  const weeksInMonth = Math.ceil((daysInMonth + offset) / 7);

  // Current week number starting from 1
  const currentWeek = Math.ceil((now.getDate() + offset) / 7);

  return {
    daysInMonth,
    weeksInMonth,
    currentDay: now.getDate(),
    currentWeek,
  };
};
