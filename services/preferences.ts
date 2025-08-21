import { appCache } from "../utils/cache";

export const fetchPreferences = async (
  telegram_id: string,
  initData: string,
  chat_id?: string | null
) => {
  // Check cache first
  const cacheKey = `preferences_${telegram_id}${chat_id ? `_${chat_id}` : ''}`;
  const cachedData = appCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  const params = new URLSearchParams({
    telegram_id,
    initData,
  });

  if (chat_id) {
    params.append("chat_id", chat_id);
  }

  const response = await fetch(`/api/preferences?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Cache for 30 minutes (preferences don't change often)
  appCache.set(cacheKey, data, 30 * 60 * 1000);
  
  return data;
};