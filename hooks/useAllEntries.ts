import { useQuery } from "@tanstack/react-query";
import { AllEntriesResponse, Category } from "../utils/types";
import { fetchAllEntries } from "../services/allEntries";

interface UseAllEntriesReturn {
  data: AllEntriesResponse | undefined;
  categories: Category[];
  isLoading: boolean;
  isError: boolean;
}

export const useAllEntries = (
  userId?: string,
  initData?: string | null,
  chat_id?: string | null
): UseAllEntriesReturn => {
  // Use the same categories query key as dashboard for cache sharing
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ["categories", userId?.toString(), chat_id],
    queryFn: async () => {
      if (!userId || !initData) return { userCategories: [], staticCategories: [] };

      const params = new URLSearchParams({
        telegram_id: userId,
        initData,
      });
      if (chat_id) params.append('chat_id', chat_id);

      const response = await fetch(`/api/categories?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to load categories: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!userId && !!initData,
    staleTime: 10 * 60 * 1000, // Match dashboard cache settings
  });

  // Query for all entries
  const {
    data: allEntries,
    isLoading: isEntriesLoading,
    isError: isEntriesError,
  } = useQuery<AllEntriesResponse>({
    queryKey: ["allEntries", userId?.toString(), chat_id],
    queryFn: () => {
      if (userId && initData) {
        return fetchAllEntries(userId, initData, chat_id);
      }
      return Promise.resolve({ expenses: [], income: [], budgets: [] });
    },
    enabled: !!userId && !!initData,
    // Use cache-first strategy - data stays fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Rely on optimistic updates, don't refetch unnecessarily
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  return {
    data: allEntries,
    categories: [
      ...(categoriesData?.userCategories || []),
      ...(categoriesData?.staticCategories || [])
    ],
    isLoading: isEntriesLoading || isCategoriesLoading,
    isError: isEntriesError || isCategoriesError,
  };
};
