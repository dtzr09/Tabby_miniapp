import { useEffect, useState } from "react";
import { init } from "@telegram-apps/sdk";
import { TelegramWebApp } from "../utils/types";
import { appCache } from "../utils/cache";

// Import the TelegramUser interface from dashboard to maintain consistency
interface TelegramUser {
  id: string;
}

interface TelegramWebAppData {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  initData: string | null;
  isReady: boolean;
}

// Cache keys for Telegram data
const TELEGRAM_CACHE_KEY = "telegram_webapp_data";
const TELEGRAM_INIT_FLAG = "telegram_initialized";

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
        // Check cache first
        const cachedData = appCache.get<TelegramWebAppData>(TELEGRAM_CACHE_KEY);
        const isInitialized = appCache.has(TELEGRAM_INIT_FLAG);

        if (cachedData && isInitialized) {
          setState(cachedData);
          return;
        }

        // Initialize once
        if (!isInitialized) {
          init();
          appCache.set(TELEGRAM_INIT_FLAG, true, 30 * 60 * 1000); // Cache for 30 minutes
        }

        const webApp = window.Telegram?.WebApp as TelegramWebApp;

        if (webApp?.initData) {
          const telegramData = {
            webApp,
            user: webApp.initDataUnsafe?.user || null,
            initData: webApp.initData,
            isReady: true,
          };

          // Cache the data for 15 minutes
          appCache.set(TELEGRAM_CACHE_KEY, telegramData, 15 * 60 * 1000);
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

              // Cache the data for 15 minutes
              appCache.set(TELEGRAM_CACHE_KEY, telegramData, 15 * 60 * 1000);
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
