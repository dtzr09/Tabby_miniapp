import { useQuery } from "@tanstack/react-query";
import { fetchUserById } from "../services/users";
import { User } from "../utils/types";

export const useUserById = (
  userId: string | number | undefined,
  initData: string | null,
  chatId?: string
) => {
  return useQuery<User | null>({
    queryKey: ["userById", userId, chatId],
    queryFn: () => {
      if (userId && initData) {
        return fetchUserById(userId, initData, chatId);
      }
      return Promise.resolve(null);
    },
    enabled: !!userId && !!initData,
  });
};
