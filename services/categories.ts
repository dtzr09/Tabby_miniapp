export const fetchCategories = async (
  telegram_id: string,
  initData: string,
  chat_id?: string | null
) => {
  const params = new URLSearchParams({ telegram_id, initData });
  if (chat_id) {
    params.append('chat_id', chat_id);
  }
  const response = await fetch(`/api/categories?${params.toString()}`);
  
  if (!response.ok) {
    const text = await response.text();
    console.error("❌ Categories API Error:", text);
    throw new Error(`Categories error ${response.status}: ${text}`);
  }

  const data = await response.json();
  
  return data;
};

export const updateCategory = async (
  categoryId: number | string,
  name: string,
  telegram_id: string,
  initData: string,
  chat_id?: string | null
) => {
  const params = new URLSearchParams({ telegram_id, initData });
  if (chat_id) {
    params.append('chat_id', chat_id);
  }
  const response = await fetch(`/api/categories?${params.toString()}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: categoryId, name }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("❌ Update Category API Error:", text);
    throw new Error(`Update category error ${response.status}: ${text}`);
  }

  console.log("✅ Category updated successfully");

  return response.json();
};

export const deleteCategory = async (
  categoryId: number | string,
  telegram_id: string,
  initData: string,
  chat_id?: string | null
) => {
  const params = new URLSearchParams({ telegram_id, initData, id: categoryId.toString() });
  if (chat_id) {
    params.append('chat_id', chat_id);
  }
  const response = await fetch(`/api/categories?${params.toString()}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("❌ Delete Category API Error:", text);
    
    // Try to parse the error message from the API response
    try {
      const errorObj = JSON.parse(text);
      if (errorObj.error) {
        throw new Error(errorObj.error);
      }
    } catch (parseError) {
      // If JSON parsing fails, fall back to formatted error
    }
    
    // For non-JSON responses or when JSON doesn't have error field
    throw new Error(`Delete category error ${response.status}: ${text}`);
  }

  console.log("✅ Category deleted successfully");

  return response.json();
};
