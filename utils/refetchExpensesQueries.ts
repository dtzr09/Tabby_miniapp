import { QueryClient } from "@tanstack/react-query";

export const refetchExpensesQueries = async (
  queryClient: QueryClient,
  userId: string
) => {
  const keys = [
    ["expensesWithBudget", userId],
    ["allEntries", userId],
  ];

  await Promise.all(
    keys.map((key) => queryClient.refetchQueries({ queryKey: key }))
  );
};
