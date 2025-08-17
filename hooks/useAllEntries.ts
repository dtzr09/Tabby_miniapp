import { useQuery } from "@tanstack/react-query";
import { AllEntriesResponse, Category } from "../utils/types";
import { fetchAllEntries } from "../services/allEntries";

interface UseAllEntriesReturn {
  data: AllEntriesResponse | undefined;
  categories: Category[];
  isLoading: boolean;
  isError: boolean;
}

export const useAllEntries = (userId?: string, initData?: string, chat_id?: string | null): UseAllEntriesReturn => {
  // Query for categories
  const { 
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError
  } = useQuery({
    queryKey: ["categories", userId],
    queryFn: async () => {
      if (!userId || !initData) return { categories: [] };

      const params = new URLSearchParams({
        telegram_id: userId,
        initData,
      });

      const response = await fetch(`/api/categories?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to load categories: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!userId && !!initData,
  });

  // Query for all entries
  const { 
    data: allEntries,
    isLoading: isEntriesLoading,
    isError: isEntriesError
  } = useQuery<AllEntriesResponse>({
    queryKey: ["allEntries", userId, chat_id],
    queryFn: () => {
      if (userId && initData) {
        return fetchAllEntries(userId, initData, chat_id);
      }
      return Promise.resolve({ expenses: [], income: [], budgets: [] });
    },
    enabled: !!userId && !!initData,
    gcTime: 300000, // Cache for 5 minutes
    refetchOnWindowFocus: true,
  });

  return {
    data: allEntries,
    categories: categoriesData?.categories || [],
    isLoading: isEntriesLoading || isCategoriesLoading,
    isError: isEntriesError || isCategoriesError,
  };
}; 