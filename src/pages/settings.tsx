import {
  backButton,
  mainButton,
  setMainButtonParams,
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

// Define UserPreferences interface locally since it's not exported from the context
interface UserPreferences {
  currency: string;
  timezone: string;
  country: string;
}

// Settings configuration for easy maintenance
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
    formState: {},
    reset,
  } = useForm<UserPreferences>({
    defaultValues,
    mode: "onChange",
  });

  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [filterDataLoaded, setFilterDataLoaded] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);

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

        // Update form with backend data
        const formData = {
          currency: data.currency || defaultValues.currency,
          timezone: data.timezone || defaultValues.timezone,
          country: data.country || defaultValues.country,
        };

        // Reset the form with the backend data
        reset(formData);

        return true;
      } catch (error) {
        console.error("❌ Error loading preferences:", error);
        return false;
      }
    },
    [reset, defaultValues]
  );

  // Optimized initialization using the useTelegramWebApp hook
  useEffect(() => {
    if (!isReady) return;

    try {
      backButton.mount();
      backButton.show();
      backButton.onClick(() => router.back());

      mainButton.mount();
      setMainButtonParams({
        isVisible: false,
      });
    } catch (err) {
      console.error("Error setting up Telegram UI:", err);
    }
  }, [isReady, router]);

  // Load preferences from backend when Telegram data is ready
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

  const renderSettingsItem = (
    item: SettingsItemConfig,
    isLast: boolean = false
  ) => {
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
          onClick={() => router.push(item.route, undefined, { shallow: false })}
          onMouseEnter={() => {
            router.prefetch(item.route);
            // Pre-cache route data if it's categories
            if (item.route === '/settings/categories' && user?.id && initData) {
              appCache.set(`prefetch_${item.route}`, true, 2 * 60 * 1000); // Cache for 2 minutes
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
            onClick={() =>
              router.push(item.route, undefined, { shallow: false })
            }
            onMouseEnter={() => {
            router.prefetch(item.route);
            // Pre-cache route data if it's categories
            if (item.route === '/settings/categories' && user?.id && initData) {
              appCache.set(`prefetch_${item.route}`, true, 2 * 60 * 1000); // Cache for 2 minutes
            }
          }}
            showBorder={!isLast}
          />
        )}
      />
    );
  };

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
