import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  backButton,
  init,
  mainButton,
  setMainButtonParams,
  showPopup,
} from "@telegram-apps/sdk";
import { TelegramWebApp } from "../../../utils/types";
import { currencies } from "../../../utils/preferencesData";
import { SettingsLayout } from "../../../components/settings/SettingsLayout";
import { SelectionList } from "../../../components/settings/SelectionList";

const CurrencySettings = () => {
  const router = useRouter();
  const [selectedCurrency, setSelectedCurrency] = useState("SGD");
  const [initialLoad, setInitialLoad] = useState(true);

  const loadPreferences = useCallback(async () => {
    try {
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      const user = webApp?.initDataUnsafe?.user;
      const initData = webApp?.initData;

      if (!user?.id || !initData) {
        console.error("Missing Telegram user/init data");
        return;
      }

      const params = new URLSearchParams({
        telegram_id: user.id.toString(),
        initData,
      });

      const response = await fetch(`/api/preferences?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setSelectedCurrency(data.currency || "SGD");
      } else {
        console.error("Failed to load preferences:", response.statusText);
      }
    } catch (error) {
      console.error("❌ Error loading preferences:", error);
    } finally {
      setInitialLoad(false);
    }
  }, []);

  const handleCurrencySelect = useCallback(async (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    
    try {
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      const user = webApp?.initDataUnsafe?.user;
      const initData = webApp?.initData;

      if (!user?.id || !initData) {
        console.error("Missing Telegram user/init data");
        return;
      }

      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: user.id.toString(),
          initData,
          currency: currencyCode,
        }),
      });

      if (response.ok) {
        router.push("/settings");
      } else {
        console.error("Failed to save preferences:", await response.text());
        showPopup({
          title: "Error",
          message: "Failed to update currency",
          buttons: [{ type: "ok" }],
        });
      }
    } catch (err) {
      console.error("Error saving currency:", err);
      showPopup({
        title: "Error",
        message: "Failed to update currency",
        buttons: [{ type: "ok" }],
      });
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      init();

      setTimeout(() => {
        try {
          backButton.mount();
          backButton.show();
          backButton.onClick(() => {
            router.push("/settings");
          });

          mainButton.mount();
          setMainButtonParams({
            isVisible: false,
          });

          loadPreferences();
        } catch (err) {
          console.error("Error setting up page:", err);
        }
      }, 0);
    }
  }, [
    router,
    loadPreferences,
  ]);

  const currencyItems = currencies.map(currency => ({
    id: currency.code,
    label: currency.name,
    subtitle: currency.code,
  }));

  return (
    <SettingsLayout title="Currency">
      <SelectionList
        items={currencyItems}
        selectedId={selectedCurrency}
        onSelect={handleCurrencySelect}
        isLoading={initialLoad}
        skeletonCount={8}
      />
    </SettingsLayout>
  );
};

export default CurrencySettings;
