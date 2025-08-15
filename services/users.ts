export const fetchUser = async (
  telegram_id: string,
  initData: string,
  chat_id?: string
) => {
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
  return data;
};
