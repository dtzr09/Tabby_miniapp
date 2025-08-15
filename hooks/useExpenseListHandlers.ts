import { useCallback } from "react";
import { FilterType } from "../utils/advancedFilterUtils";

interface FilterOptions {
  categoryId?: string;
  showIncome?: boolean;
}

interface UseExpenseListHandlersProps {
  setIsSearchActive: (active: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCurrentFilter: (filter: FilterType) => void;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  setViewType: (type: "Week" | "Month") => void;
  setTimeOffset: (offset: number) => void;
  setSelectedDate: (date: string | null) => void;
}

export const useExpenseListHandlers = ({
  setIsSearchActive,
  setSearchQuery,
  setCurrentFilter,
  setFilterOptions,
  setViewType,
  setTimeOffset,
  setSelectedDate,
}: UseExpenseListHandlersProps) => {
  // Search handlers
  const toggleSearch = useCallback(() => {
    setIsSearchActive(true);
    setSearchQuery("");
  }, [setIsSearchActive, setSearchQuery]);

  const cancelSearch = useCallback(() => {
    setIsSearchActive(false);
    setSearchQuery("");
  }, [setIsSearchActive, setSearchQuery]);

  const updateSearchQuery = useCallback((value: string) => {
    setSearchQuery(value);
  }, [setSearchQuery]);

  // Filter handlers
  const clearFilter = useCallback(() => {
    setCurrentFilter("all");
    setFilterOptions({});
  }, [setCurrentFilter, setFilterOptions]);

  const handleFilterChange = useCallback((type: FilterType) => {
    setCurrentFilter(type);
    setFilterOptions({});
  }, [setCurrentFilter, setFilterOptions]);

  const handleCategorySelect = useCallback((category: string) => {
    setFilterOptions(prev => ({ ...prev, categoryId: category }));
  }, [setFilterOptions]);

  const handleTypeSelect = useCallback((type: "income" | "expense") => {
    setFilterOptions(prev => ({ ...prev, showIncome: type === "income" }));
  }, [setFilterOptions]);

  // View handlers
  const handleViewTypeChange = useCallback((type: "Week" | "Month") => {
    setViewType(type);
    setTimeOffset(0);
    setSelectedDate(null);
  }, [setViewType, setTimeOffset, setSelectedDate]);

  const handleTimeOffsetChange = useCallback((offset: number) => {
    setTimeOffset(offset);
    setSelectedDate(null);
  }, [setTimeOffset, setSelectedDate]);

  const handleDateSelect = useCallback((date: string | null) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  return {
    // Search
    toggleSearch,
    cancelSearch,
    updateSearchQuery,
    
    // Filters
    clearFilter,
    handleFilterChange,
    handleCategorySelect,
    handleTypeSelect,
    
    // Views
    handleViewTypeChange,
    handleTimeOffsetChange,
    handleDateSelect,
  };
};