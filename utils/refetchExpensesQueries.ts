import { QueryClient } from "@tanstack/react-query";

export const refetchExpensesQueries = async (
  queryClient: QueryClient,
  userId: string
) => {
  const keys = [
    ["expensesWithBudget", userId] as const,
    ["allEntries", userId] as const,
  ];

  // Immediately refetch active queries without invalidating first
  await Promise.all(
    keys.map((key) =>
      queryClient.refetchQueries({
        queryKey: key,
        exact: true,
        type: "active",
        stale: true // Mark as stale to force refetch
      })
    )
  );
};
