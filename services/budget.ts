import { appCache } from "../utils/cache";

export const fetchBudgets = async (telegram_id: string, initData: string) => {
  // Check cache first
  const cacheKey = `budgets_${telegram_id}`;
  const cachedData = appCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  const params = new URLSearchParams({
    telegram_id,
    initData,
  });

  const response = await fetch(`/api/budgets?${params.toString()}`).then(
    (res) => {
      if (!res.ok) {
        return res.text().then((text) => {
          console.error("❌ Budgets API Error:", text);
          throw new Error(`Budgets error ${res.status}: ${text}`);
        });
      }
      return res.json();
    }
  );

  const data = Array.isArray(response) ? response : [];
  
  // Cache for 10 minutes
  appCache.set(cacheKey, data, 10 * 60 * 1000);
  
  return data;
};
