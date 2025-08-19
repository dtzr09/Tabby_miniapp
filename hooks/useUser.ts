import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "../services/users";
import { User } from "../utils/types";

export const useUser = (
  telegramId: string | undefined,
  initData: string | undefined,
  chatId?: string
) => {
  return useQuery<User | null>({
    queryKey: ["user", telegramId, chatId],
    queryFn: () => {
      if (telegramId && initData) {
        return fetchUser(telegramId, initData, chatId);
      }
      return Promise.resolve(null);
    },
    enabled: !!telegramId && !!initData,
  });
}; 