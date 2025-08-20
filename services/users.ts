import { appCache } from "../utils/cache";

export const fetchUser = async (
  telegram_id: string,
  initData: string,
  chat_id?: string
) => {
  // Check cache first
  const cacheKey = `user_${telegram_id}_${chat_id || 'personal'}`;
  const cachedData = appCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  const params = new URLSearchParams({
    telegram_id,
    initData,
  });

  if (chat_id) {
    params.set("chat_id", chat_id);
  }

  const response = await fetch(`/api/users?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }
  const data = await response.json();
  
  // Cache for 15 minutes
  appCache.set(cacheKey, data, 15 * 60 * 1000);
  
  return data;
};
