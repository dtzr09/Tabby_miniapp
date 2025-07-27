import { TelegramWebApp } from "../utils/types";

export const handleDelete = async (id: number, onSuccess: () => void) => {
  try {
    const webApp = window.Telegram?.WebApp as TelegramWebApp;
    const user = webApp.initDataUnsafe?.user;
    const initData = webApp.initData;

    if (!user?.id || !initData) {
      throw new Error("Missing Telegram user/init data");
    }

    const response = await fetch(`/api/expenses/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        telegram_id: user.id.toString(),
        initData,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete expense");
    }
    onSuccess();
  } catch (err) {
    console.error("Delete failed:", err);
  }
};
