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
import { getAllCountries, getCountry } from "countries-and-timezones";
import { currencies } from "../../../utils/preferencesData";
import countryToCurrency from "country-to-currency";
import { SettingsLayout } from "../../../components/settings/SettingsLayout";
import { SelectionList } from "../../../components/settings/SelectionList";

const CountrySettings = () => {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState("SG");
  const [initialLoad, setInitialLoad] = useState(true);

  // Get all countries and filter/sort them
  const countries = getAllCountries();
  const supportedCurrencyCodes = new Set(
    currencies.map((c) => c.code as keyof typeof countryToCurrency)
  );

  const validCountries = Object.values(countries)
    .filter((country) => {
      const currency =
        countryToCurrency[country.id as keyof typeof countryToCurrency];
      return (
        currency &&
        supportedCurrencyCodes.has(currency as keyof typeof countryToCurrency)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

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
        setSelectedCountry(data.country || "SG");
      } else {
        console.error("Failed to load preferences:", response.statusText);
      }
    } catch (error) {
      console.error("❌ Error loading preferences:", error);
    } finally {
      setInitialLoad(false);
    }
  }, []);

  const handleCountrySelect = useCallback(async (countryId: string) => {
    setSelectedCountry(countryId);
    
    try {
      const webApp = window.Telegram?.WebApp as TelegramWebApp;
      const user = webApp?.initDataUnsafe?.user;
      const initData = webApp?.initData;

      if (!user?.id || !initData) {
        console.error("Missing Telegram user/init data");
        return;
      }

      const country = getCountry(countryId);
      let updateData: {
        telegram_id: string;
        initData: string;
        country: string;
        timezone?: string;
        currency?: string;
      } = {
        telegram_id: user.id.toString(),
        initData,
        country: countryId,
      };

      // Auto-update timezone and currency based on country
      if (country && country.timezones && country.timezones.length > 0) {
        updateData = {
          ...updateData,
          timezone: country.timezones[0],
        };

        // Auto-update currency based on country
        const countryCurrency =
          countryToCurrency[countryId as keyof typeof countryToCurrency];
        if (countryCurrency) {
          const isCurrencySupported = currencies.some(
            (c) => c.code === countryCurrency
          );
          if (isCurrencySupported) {
            updateData = {
              ...updateData,
              currency: countryCurrency,
            };
          }
        }
      }

      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        router.push("/settings");
      } else {
        console.error("Failed to save preferences:", await response.text());
        showPopup({
          title: "Error",
          message: "Failed to update country",
          buttons: [{ type: "ok" }],
        });
      }
    } catch (err) {
      console.error("Error saving country:", err);
      showPopup({
        title: "Error",
        message: "Failed to update country",
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

  const countryItems = validCountries.map(country => ({
    id: country.id,
    label: country.name,
  }));

  return (
    <SettingsLayout title="Country">
      <SelectionList
        items={countryItems}
        selectedId={selectedCountry}
        onSelect={handleCountrySelect}
        isLoading={initialLoad}
        skeletonCount={8}
      />
    </SettingsLayout>
  );
};

export default CountrySettings;
