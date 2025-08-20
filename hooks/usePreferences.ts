import { useCallback, useState } from "react";
import { TelegramWebApp } from "../utils/types";

interface UserPreferences {
  currency: string;
  timezone: string;
  country: string;
}

export const usePreferences = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadPreferences =
    useCallback(async (): Promise<UserPreferences | null> => {
      try {
        const webApp = window.Telegram?.WebApp as TelegramWebApp;
        const user = webApp?.initDataUnsafe?.user;
        const initData = webApp?.initData;

        if (!user?.id || !initData) {
          console.error("Missing Telegram user/init data");
          return null;
        }

        const params = new URLSearchParams({
          telegram_id: user.id.toString(),
          initData,
        });

        const response = await fetch(`/api/preferences?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          return {
            currency: data.currency || "SGD",
            timezone:
              data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            country: data.country || "SG",
          };
        } else {
          console.error("Failed to load preferences:", response.statusText);
          return null;
        }
      } catch (error) {
        console.error("❌ Error loading preferences:", error);
        return null;
      }
    }, []);

  const savePreferences = useCallback(
    async (preferences: Partial<UserPreferences>): Promise<boolean> => {
      try {
        setIsLoading(true);
        const webApp = window.Telegram?.WebApp as TelegramWebApp;
        const user = webApp?.initDataUnsafe?.user;
        const initData = webApp?.initData;

        if (!user?.id || !initData) {
          console.error("Missing Telegram user/init data");
          return false;
        }

        const response = await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: user.id.toString(),
            initData,
            ...preferences,
          }),
        });

        return response.ok;
      } catch (error) {
        console.error("Error saving preferences:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    loadPreferences,
    savePreferences,
    isLoading,
  };
};
