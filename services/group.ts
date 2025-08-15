export const fetchGroups = async (telegram_id: string, initData: string) => {
  const params = new URLSearchParams({
    telegram_id,
    initData,
  });

  const response = await fetch(`/api/groups?${params.toString()}`);
  return response.json();
};
