import { QueryClient } from "@tanstack/react-query";

export const refetchExpensesQueries = async (
  queryClient: QueryClient,
  userId: string
) => {
  const keys = [
    ["expensesWithBudget", userId] as const,
    ["allEntries", userId] as const,
  ];

  // First invalidate the queries to mark them as stale
  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: key, exact: true });
  });

  // Then refetch only active queries
  await Promise.all(
    keys.map((key) =>
      queryClient.refetchQueries({
        queryKey: key,
        exact: true,
        type: "active",
      })
    )
  );
};
