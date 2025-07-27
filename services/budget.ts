export const fetchBudgets = async (telegram_id: string, initData: string) => {
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

  if (!response.ok) {
    throw new Error(`Budgets error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};
