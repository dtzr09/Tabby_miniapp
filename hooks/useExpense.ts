import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { AllEntriesResponse } from "../utils/types";
import { UnifiedEntry } from "../utils/types";
import { refetchExpensesQueries } from "../utils/refetchExpensesQueries";

interface UseExpenseProps {
  id: string | number;
  isIncome: boolean;
  userId?: string;
  initData?: string | null;
  chat_id?: string;
}

export const useExpense = ({
  id,
  isIncome,
  userId,
  initData,
  chat_id,
}: UseExpenseProps) => {
  const queryClient = useQueryClient();

  // Memoized function to get data from cache
  const getExpenseFromCache = useMemo(() => {
    // First try to get from allEntries cache
    const allEntriesData = queryClient.getQueryData<AllEntriesResponse>([
      "allEntries",
      userId?.toString(),
      chat_id,
    ]);

    if (allEntriesData) {
      // Look in either expenses or income array based on isIncome flag
      const entry = isIncome
        ? allEntriesData.income.find((e) => e.id.toString() === id.toString())
        : allEntriesData.expenses.find(
            (e) => e.id.toString() === id.toString()
          );

      if (entry) {
        return entry;
      }
    }

    // Fallback to individual expense cache
    if (id) {
      const individualExpenseData = queryClient.getQueryData([
        "expense",
        id.toString(),
      ]);

      if (individualExpenseData) {
        return individualExpenseData;
      }
    }

    return undefined;
  }, [queryClient, userId, chat_id, id, isIncome]);

  // Function to update expense in all relevant caches
  const updateExpenseInCache = (updatedExpense: UnifiedEntry) => {
    // Update in individual expense cache first
    queryClient.setQueryData(["expense", id], updatedExpense);

    // Update in allEntries cache - match the exact key format from useAllEntries
    const allEntriesKey = ["allEntries", userId?.toString(), chat_id];

    queryClient.setQueryData<AllEntriesResponse>(allEntriesKey, (oldData) => {
      if (!oldData) {
        return oldData;
      }

      const targetArray = isIncome ? "income" : "expenses";
      const updatedData = {
        ...oldData,
        [targetArray]: oldData[targetArray].map((entry) =>
          entry.id.toString() === id.toString() ? updatedExpense : entry
        ),
      };

      return updatedData;
    });

    // // Use the existing refetch utility for proper expense query management
    // if (userId) {
    //   refetchExpensesQueries(
    //     queryClient,
    //     userId.toString(),
    //     chat_id?.toString() || ""
    //   );
    // }
  };

  // Function to delete expense from all caches
  const deleteExpenseFromCache = () => {
    // Remove from allEntries cache - match the exact key format from useAllEntries
    queryClient.setQueryData<AllEntriesResponse>(
      ["allEntries", userId?.toString(), chat_id],
      (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          expenses: isIncome
            ? oldData.expenses
            : oldData.expenses.filter((e) => e.id.toString() !== id.toString()),
          income: isIncome
            ? oldData.income.filter((i) => i.id.toString() !== id.toString())
            : oldData.income,
        };
      }
    );

    // Remove from individual expense cache
    queryClient.removeQueries({ queryKey: ["expense", id] });
  };

  const query = useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      if (!userId || !initData) {
        throw new Error("Missing required data");
      }

      const params = new URLSearchParams({
        chat_id: chat_id ? chat_id : userId,
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

      const data = await response.json();

      // Update cache with fresh data from API
      queryClient.setQueryData(["expense", id], data);

      return data;
    },
    initialData: getExpenseFromCache,
    enabled: !!userId && !!initData,
    staleTime: 0, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Use cache data if available, otherwise use query data
  const currentData = getExpenseFromCache || query.data;

  return {
    ...query,
    data: currentData,
    updateExpenseInCache,
    deleteExpenseFromCache,
    refreshCache: () => {
      queryClient.invalidateQueries({ queryKey: ["expense", id] });
    },
  };
};
