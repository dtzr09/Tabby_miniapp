import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AllEntriesResponse } from "../utils/types";

interface UseExpenseProps {
  id: string | number;
  isIncome: boolean;
  userId?: string;
  initData?: string;
}

export const useExpense = ({
  id,
  isIncome,
  userId,
  initData,
}: UseExpenseProps) => {
  const queryClient = useQueryClient();

  // Function to get data from cache
  const getFromCache = () => {
    const allEntriesData = queryClient.getQueryData<AllEntriesResponse>([
      "allEntries",
      userId,
    ]);

    if (!allEntriesData) return undefined;

    // Look in either expenses or income array based on isIncome flag
    const entry = isIncome
      ? allEntriesData.income.find((e) => e.id.toString() === id.toString())
      : allEntriesData.expenses.find((e) => e.id.toString() === id.toString());

    return entry;
  };

  return useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      if (!userId || !initData) {
        throw new Error("Missing required data");
      }

      const params = new URLSearchParams({
        telegram_id: userId,
        initData,
        isIncome: isIncome.toString(),
      });

      const response = await fetch(`/api/entries/${id}?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Expense not found");
        }
        const text = await response.text();
        throw new Error(`Failed to fetch expense: ${text}`);
      }

      return response.json();
    },
    initialData: getFromCache,
    placeholderData: getFromCache, // This ensures we never have a loading state
    enabled: !!userId && !!initData,
    staleTime: 0, // Consider cached data immediately stale
    gcTime: 300000, // Keep unused data in cache for 5 minutes
  });
};
