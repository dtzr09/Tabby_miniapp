import { useCallback, useMemo } from "react";

export const useDateCalculations = (
  viewType: "Week" | "Month",
  timeOffset: number,
  earliestDate: Date | null
) => {
  // Helper functions for date calculations
  const getWeekStart = useCallback((date: Date) => {
    const currentDay = date.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const result = new Date(date);
    result.setDate(date.getDate() - daysToMonday);
    result.setHours(0, 0, 0, 0);
    return result;
  }, []);

  const getMonthStart = useCallback((date: Date) => {
    const result = new Date(date.getFullYear(), date.getMonth(), 1);
    result.setHours(0, 0, 0, 0);
    return result;
  }, []);

  // Date range calculations
  const dateCalculations = useMemo(() => {
    const earliestAllowedDate = !earliestDate ? null : 
      viewType === "Week" ? getWeekStart(earliestDate) : getMonthStart(earliestDate);

    const now = new Date();
    const targetDate = viewType === "Week"
      ? getWeekStart(new Date(now.setDate(now.getDate() + (timeOffset - 1) * 7)))
      : getMonthStart(new Date(now.setMonth(now.getMonth() + timeOffset - 1)));

    const canGoBack = earliestAllowedDate ? targetDate >= earliestAllowedDate : false;

    return { earliestAllowedDate, canGoBack };
  }, [earliestDate, viewType, timeOffset, getWeekStart, getMonthStart]);

  // Calculate current date range
  const dateRange = useMemo(() => {
    const today = new Date();
    let startDate: Date, endDate: Date;

    if (viewType === "Week") {
      startDate = getWeekStart(new Date(today.setDate(today.getDate() + timeOffset * 7)));
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      startDate = getMonthStart(new Date(today.setMonth(today.getMonth() + timeOffset)));
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    }
    endDate.setHours(23, 59, 59, 999);

    // Ensure we don't go before the earliest allowed date
    if (dateCalculations.earliestAllowedDate && startDate < dateCalculations.earliestAllowedDate) {
      startDate = new Date(dateCalculations.earliestAllowedDate);
      endDate = viewType === "Week"
        ? new Date(startDate.setDate(startDate.getDate() + 6))
        : new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const formatDate = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return {
      display: `${formatDate(startDate)} - ${formatDate(endDate)}, ${endDate.getFullYear()}`,
      start: startDate,
      end: endDate,
    };
  }, [timeOffset, viewType, dateCalculations.earliestAllowedDate, getWeekStart, getMonthStart]);

  return {
    dateRange,
    canGoBack: dateCalculations.canGoBack,
    getWeekStart,
    getMonthStart,
  };
};