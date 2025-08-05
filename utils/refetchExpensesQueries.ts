import { QueryClient } from "@tanstack/react-query";

export const refetchExpensesQueries = async (
  queryClient: QueryClient,
  userId: string
) => {
  const keys = [
    ["expensesAndBudgets", userId],
    ["expensesWithBudget", userId],
    ["expenses", userId],
  ];

  await Promise.all(
    keys.map((key) => queryClient.refetchQueries({ queryKey: key }))
  );
};
