export const fetchUserCount = async (telegram_id: string, initData: string, chat_id: string) => {
  const params = new URLSearchParams({
    telegram_id,
    initData,
    chat_id,
  });

  const response = await fetch(`/api/users/count?${params.toString()}`).then(
    (res) => {
      if (!res.ok) {
        return res.text().then((text) => {
          console.error("❌ User Count API Error:", text);
          throw new Error(`User count error ${res.status}: ${text}`);
        });
      }
      return res.json();
    }
  );

  return response.userCount || 1;
};