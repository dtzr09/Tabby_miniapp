import { useEffect, useState } from "react";
import { init } from "@telegram-apps/sdk";
import { TelegramWebApp } from "../utils/types";
import { TelegramUser } from "../components/dashboard";

interface TelegramWebAppData {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  initData: string | null;
  isReady: boolean;
  error?: string;
}

let telegramInitialized = false;

export const useTelegramWebApp = (): TelegramWebAppData => {
  const [state, setState] = useState<TelegramWebAppData>({
    webApp: null,
    user: null,
    initData: null,
    isReady: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeTelegram = () => {
      try {
        // Initialize once
        if (!telegramInitialized) {
          init();
          telegramInitialized = true;
        }

        const webApp = window.Telegram?.WebApp as TelegramWebApp;

        if (webApp?.initData) {
          const telegramData = {
            webApp,
            user: webApp.initDataUnsafe?.user || null,
            initData: webApp.initData,
            isReady: true,
          };

          setState(telegramData);
        } else {
          // Retry without delay for better performance
          const checkAgain = () => {
            const webApp = window.Telegram?.WebApp as TelegramWebApp;
            if (webApp?.initData) {
              const telegramData = {
                webApp,
                user: webApp.initDataUnsafe?.user || null,
                initData: webApp.initData,
                isReady: true,
              };

              setState(telegramData);
            } else {
              // Only retry a few times to avoid infinite loops
              setTimeout(checkAgain, 25); // Further reduced to 25ms
            }
          };
          checkAgain();
        }
      } catch (err) {
        console.error("❌ Telegram Init Failed:", err);
        setState((prev) => ({ ...prev, isReady: true })); // Still mark as ready to prevent infinite loading
      }
    };

    initializeTelegram();
  }, []);

  return state;
};
