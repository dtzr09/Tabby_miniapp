import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Expense, Category, AllEntriesResponse } from "../utils/types";

interface UseEntryDataProps {
  entryId: string;
  isIncome: boolean;
  chat_id?: string;
}

interface UseEntryDataReturn {
  isLoading: boolean;
  expense: Expense | null;
  categories: Category[];
  loadData: (telegram_id: string, initData: string) => Promise<boolean>;
}

export const useEntryData = ({
  entryId,
  isIncome,
  chat_id,
}: UseEntryDataProps): UseEntryDataReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const queryClient = useQueryClient();

  const loadCategories = useCallback(
    async (telegram_id: string, initData: string): Promise<boolean> => {
      try {
        const params = new URLSearchParams({
          telegram_id,
          initData,
        });

        const response = await fetch(`/api/categories?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to load categories: ${response.statusText}`);
        }

        const data = await response.json();
        setCategories(data.categories || []);
        return true;
      } catch (error) {
        console.error("❌ Error loading categories:", error);
        return false;
      }
    },
    []
  );

  const loadEntryDetail = useCallback(
    async (telegram_id: string, initData: string): Promise<boolean> => {
      try {
        // Try to get the expense from the cache first
        const cachedData = queryClient.getQueryData<AllEntriesResponse>([
          "allEntries",
          telegram_id,
          chat_id,
        ]);

        if (cachedData) {
          // Find the expense in the cached data
          const foundExpense = isIncome
            ? cachedData.income.find((i) => i.id.toString() === entryId)
            : cachedData.expenses.find((e) => e.id.toString() === entryId);

          if (foundExpense) {
            setExpense(foundExpense as Expense);
            return true;
          }
        }

        // If not found in cache, fetch from API
        const params = new URLSearchParams({
          telegram_id,
          initData,
        });

        const response = await fetch(
          `/api/entries/${entryId}?${params.toString()}&isIncome=${isIncome}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load entry: ${response.statusText}`);
        }

        const data = await response.json();
        setExpense(data);
        return true;
      } catch (error) {
        console.error("❌ Error loading entry:", error);
        return false;
      }
    },
    [entryId, isIncome, queryClient, chat_id]
  );

  const loadData = useCallback(
    async (telegram_id: string, initData: string): Promise<boolean> => {
      if (!telegram_id || !initData || !entryId) {
        console.error("Missing required data for loading");
        return false;
      }

      // Don't reload if we're already loading or have data
      if (isLoading || (expense && categories.length > 0)) {
        return true;
      }

      setIsLoading(true);
      try {
        const [categoriesSuccess, entrySuccess] = await Promise.all([
          loadCategories(telegram_id, initData),
          loadEntryDetail(telegram_id, initData),
        ]);

        return categoriesSuccess && entrySuccess;
      } catch (error) {
        console.error("Error loading data:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [loadCategories, loadEntryDetail, entryId, isLoading, expense, categories]
  );

  return {
    isLoading,
    expense,
    categories,
    loadData,
  };
};
