import {
  backButton,
  mainButton,
  setMainButtonParams,
  showPopup,
} from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Box, Typography, Skeleton } from "@mui/material";
import { useTheme } from "../contexts/ThemeContext";
import { currencies } from "../../utils/preferencesData";
import { Country, getAllCountries } from "countries-and-timezones";
import countryToCurrency from "country-to-currency";
import { useForm, Controller } from "react-hook-form";
import { SettingsLayout } from "../../components/settings/SettingsLayout";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { SettingsItem } from "../../components/settings/SettingsItem";
import { useTelegramWebApp } from "../../hooks/useTelegramWebApp";
import { appCache } from "../../utils/cache";
import { SelectionList } from "../../components/settings/SelectionList";
import CategoriesSettings from "./settings/categories";

// Types
interface UserPreferences {
  currency: string;
  timezone: string;
  country: string;
}

interface SettingsItemConfig {
  key: string;
  title: string;
  icon: string;
  iconBg: string;
  route: string;
  getValue?: (
    field: { value: string },
    filteredCountries?: Country[]
  ) => string;
}

type SettingsView = "main" | "country" | "currency" | "categories";

interface ViewConfig {
  title: string;
  component: React.ReactNode;
}

// Configuration
const SETTINGS_CONFIG = {
  general: [
    {
      key: "country",
      title: "Country",
      icon: "🌍",
      iconBg: "#34C759",
      route: "/settings/country",
      getValue: (
        field: { value: string },
        filteredCountries: Country[] = []
      ) => {
        const country = filteredCountries.find((c) => c.id === field.value);
        return country ? country.name : field.value;
      },
    },
    {
      key: "currency",
      title: "Currency",
      icon: "💰",
      iconBg: "#007AFF",
      route: "/settings/currency",
      getValue: (field: { value: string }) => field.value || "SGD",
    },
  ] as SettingsItemConfig[],
  data: [
    {
      key: "categories",
      title: "Categories",
      icon: "📋",
      iconBg: "#5856D6",
      route: "/settings/categories",
    },
  ] as SettingsItemConfig[],
};

const Settings = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<SettingsView>("main");
  const [selectedCountry, setSelectedCountry] = useState("SG");
  const [selectedCurrency, setSelectedCurrency] = useState("SGD");
  const [initialLoad, setInitialLoad] = useState(true);

  // Use optimized Telegram WebApp hook
  const { user, initData, isReady } = useTelegramWebApp();

  const defaultValues: UserPreferences = useMemo(
    () => ({
      currency: "SGD",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: "SG",
    }),
    []
  );

  const {
    control,
    reset,
  } = useForm<UserPreferences>({
    defaultValues,
    mode: "onChange",
  });

  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [filterDataLoaded, setFilterDataLoaded] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);

  // Initialize filtered countries
  useEffect(() => {
    const allCountries = getAllCountries();
    const supportedCurrencyCodes = new Set(
      currencies.map((c) => c.code as keyof typeof countryToCurrency)
    );

    const validCountries = Object.values(allCountries).filter((country) => {
      const currency =
        countryToCurrency[country.id as keyof typeof countryToCurrency];
      return (
        currency &&
        supportedCurrencyCodes.has(currency as keyof typeof countryToCurrency)
      );
    });

    setFilteredCountries(validCountries);
    setFilterDataLoaded(true);
  }, []);

  // Load preferences from backend
  const loadPreferencesFromBackend = useCallback(
    async (telegram_id: string, initData: string): Promise<boolean> => {
      try {
        const params = new URLSearchParams({
          telegram_id,
          initData,
        });

        const response = await fetch(`/api/preferences?${params.toString()}`);

        if (!response.ok) {
          console.error("Failed to load preferences:", response.statusText);
          return false;
        }

        const data = await response.json();

        const formData = {
          currency: data.currency || defaultValues.currency,
          timezone: data.timezone || defaultValues.timezone,
          country: data.country || defaultValues.country,
        };

        reset(formData);
        setSelectedCountry(formData.country);
        setSelectedCurrency(formData.currency);
        setInitialLoad(false);

        return true;
      } catch (error) {
        console.error("❌ Error loading preferences:", error);
        return false;
      }
    },
    [reset, defaultValues]
  );

  // Telegram UI setup
  useEffect(() => {
    if (!isReady) return;

    try {
      backButton.mount();
      backButton.show();

      mainButton.mount();
      setMainButtonParams({
        isVisible: false,
      });
    } catch (err) {
      console.error("Error setting up Telegram UI:", err);
    }
  }, [isReady]);

  // Back button handler
  useEffect(() => {
    if (!isReady) return;

    const handleBack = () => {
      if (currentView === "main") {
        router.back();
      } else {
        setCurrentView("main");
      }
    };

    try {
      backButton.onClick(handleBack);
    } catch (err) {
      console.error("Error setting up back button:", err);
    }

    return () => {
      try {
        backButton.offClick(handleBack);
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [isReady, router, currentView]);

  // Load preferences when ready
  useEffect(() => {
    if (!isReady || !user?.id || !initData || preferencesLoaded || isLoading)
      return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadPreferencesFromBackend(user.id.toString(), initData);
        setPreferencesLoaded(true);
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [
    isReady,
    user,
    initData,
    preferencesLoaded,
    isLoading,
    loadPreferencesFromBackend,
  ]);

  // Selection handlers
  const handleCountrySelect = useCallback(
    async (countryId: string) => {
      setSelectedCountry(countryId);

      try {
        if (!user?.id || !initData) {
          console.error("Missing Telegram user/init data");
          return;
        }

        const country = filteredCountries.find((c) => c.id === countryId);
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
              setSelectedCurrency(countryCurrency);
            }
          }
        }

        const response = await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          setCurrentView("main");
          reset({
            currency: updateData.currency || selectedCurrency,
            timezone: updateData.timezone || defaultValues.timezone,
            country: countryId,
          });
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
    },
    [user, initData, filteredCountries, selectedCurrency, defaultValues, reset]
  );

  const handleCurrencySelect = useCallback(
    async (currencyCode: string) => {
      setSelectedCurrency(currencyCode);

      try {
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
          setCurrentView("main");
          reset({
            currency: currencyCode,
            timezone: defaultValues.timezone,
            country: selectedCountry,
          });
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
    },
    [user, initData, defaultValues, selectedCountry, reset]
  );

  // View handlers
  const handleViewChange = useCallback((view: SettingsView) => {
    setCurrentView(view);
  }, []);

  // View configurations - easy to extend
  const getViewConfig = useCallback((): ViewConfig | null => {
    switch (currentView) {
      case "country":
        const countryItems = filteredCountries.map((country) => ({
          id: country.id,
          label: country.name,
        }));
        return {
          title: "Country",
          component: (
            <SelectionList
              items={countryItems}
              selectedId={selectedCountry}
              onSelect={handleCountrySelect}
              isLoading={initialLoad}
              skeletonCount={8}
            />
          ),
        };

      case "currency":
        const currencyItems = currencies.map((currency) => ({
          id: currency.code,
          label: currency.name,
          subtitle: currency.code,
        }));
        return {
          title: "Currency",
          component: (
            <SelectionList
              items={currencyItems}
              selectedId={selectedCurrency}
              onSelect={handleCurrencySelect}
              isLoading={initialLoad}
              skeletonCount={8}
            />
          ),
        };

      case "categories":
        return {
          title: "Categories",
          component: <CategoriesSettings />,
        };

      default:
        return null;
    }
  }, [
    currentView,
    filteredCountries,
    selectedCountry,
    handleCountrySelect,
    initialLoad,
    selectedCurrency,
    handleCurrencySelect,
  ]);

  // Render settings item
  const renderSettingsItem = useCallback(
    (item: SettingsItemConfig, isLast: boolean = false) => {
      if (item.key === "categories") {
        return (
          <SettingsItem
            key={item.key}
            icon={
              <Box
                sx={{
                  bgcolor: item.iconBg,
                  width: "100%",
                  borderRadius: 1.2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography sx={{ fontSize: "1.1rem", color: "white" }}>
                  {item.icon}
                </Typography>
              </Box>
            }
            title={item.title}
            onClick={() => handleViewChange("categories")}
            onMouseEnter={() => {
              if (user?.id && initData) {
                appCache.set(`prefetch_${item.route}`, true, 2 * 60 * 1000);
              }
            }}
            showBorder={!isLast}
          />
        );
      }

      return (
        <Controller
          key={item.key}
          name={item.key as keyof UserPreferences}
          control={control}
          render={({ field }) => (
            <SettingsItem
              icon={
                <Box
                  sx={{
                    bgcolor: item.iconBg,
                    width: "100%",
                    height: "100%",
                    borderRadius: 1.2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography sx={{ fontSize: "1.1rem", color: "white" }}>
                    {item.icon}
                  </Typography>
                </Box>
              }
              title={item.title}
              value={
                item.getValue
                  ? item.getValue(field, filteredCountries)
                  : field.value
              }
              onClick={() => {
                if (item.key === "country") handleViewChange("country");
                else if (item.key === "currency") handleViewChange("currency");
              }}
              onMouseEnter={() => {
                if (
                  item.route === "/settings/categories" &&
                  user?.id &&
                  initData
                ) {
                  appCache.set(`prefetch_${item.route}`, true, 2 * 60 * 1000);
                }
              }}
              showBorder={!isLast}
            />
          )}
        />
      );
    },
    [control, filteredCountries, handleViewChange, user?.id, initData]
  );

  // Loading state
  if (!filterDataLoaded || !preferencesLoaded || isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Skeleton
            variant="rectangular"
            sx={{ height: 60, borderRadius: 1, bgcolor: colors.surface }}
          />
          <Skeleton
            variant="rectangular"
            sx={{ height: 60, borderRadius: 1, bgcolor: colors.surface }}
          />
        </Box>
      </Box>
    );
  }

  // Render sub-views
  const viewConfig = getViewConfig();
  if (viewConfig) {
    return (
      <SettingsLayout title={viewConfig.title}>
        {viewConfig.component}
      </SettingsLayout>
    );
  }

  // Main settings view
  return (
    <SettingsLayout title="Settings">
      <SettingsSection title="GENERAL">
        {SETTINGS_CONFIG.general.map((item, index) =>
          renderSettingsItem(item, index === SETTINGS_CONFIG.general.length - 1)
        )}
      </SettingsSection>

      <SettingsSection title="DATA">
        {SETTINGS_CONFIG.data.map((item, index) =>
          renderSettingsItem(item, index === SETTINGS_CONFIG.data.length - 1)
        )}
      </SettingsSection>
    </SettingsLayout>
  );
};

export default Settings;