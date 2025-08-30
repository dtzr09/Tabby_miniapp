export const fetchPreferences = async (
  telegram_id: string,
  initData: string,
  chat_id?: string | null
) => {
  const params = new URLSearchParams({
    telegram_id,
    initData,
  });

  if (chat_id) {
    params.append("chat_id", chat_id);
  }

  console.log("🔍 Chat ID:", chat_id);
  const response = await fetch(`/api/preferences?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: ${response.statusText}`);
  }

  const data = await response.json();
  
  return data;
};