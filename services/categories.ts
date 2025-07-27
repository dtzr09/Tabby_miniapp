export const fetchCategories = async (
  telegram_id: string,
  initData: string
) => {
  const params = new URLSearchParams({ telegram_id, initData });
  const response = await fetch(`/api/categories?${params.toString()}`).then(
    (res) => {
      if (!res.ok) {
        return res.text().then((text) => {
          console.error("❌ Categories API Error:", text);
          throw new Error(`Categories error ${res.status}: ${text}`);
        });
      }
      return res.json();
    }
  );

  if (!response.ok) {
    throw new Error(
      `Categories error ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
};
