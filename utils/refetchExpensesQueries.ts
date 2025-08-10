import { QueryClient } from "@tanstack/react-query";

export const refetchExpensesQueries = async (
  queryClient: QueryClient,
  userId: string
) => {
  const keys = [
    ["expensesWithBudget", userId] as const,
    ["allEntries", userId] as const,
  ];

  // Invalidate first
  await Promise.all(
    keys.map((key) =>
      queryClient.invalidateQueries({ queryKey: key, exact: true })
    )
  );

  // Then refetch only active instances immediately
  await Promise.all(
    keys.map((key) =>
      queryClient.refetchQueries({ queryKey: key, type: "active", exact: true })
    )
  );
};
