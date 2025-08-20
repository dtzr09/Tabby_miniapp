import {
  backButton,
  init,
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
import { TelegramWebApp } from "../../utils/types";
import countryToCurrency from "country-to-currency";
import { useForm, Controller } from "react-hook-form";
import { SettingsLayout } from "../../components/settings/SettingsLayout";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { SettingsItem } from "../../components/settings/SettingsItem";

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
    handleSubmit,
    formState: { isDirty, isSubmitting },
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

        // Reset the form with the backend data as the new baseline
        reset(formData, { keepDirty: false });

        return true;
      } catch (error) {
        console.error("❌ Error loading preferences:", error);
        return false;
      }
    },
    [reset, defaultValues]
  );

  // Load preferences from backend only once on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      init();

      setTimeout(async () => {
        try {
          backButton.mount();
          backButton.show();

          backButton.onClick(() => router.back());

          mainButton.mount();
          setMainButtonParams({
            isVisible: false,
          });

          // Load preferences from backend only once
          const webApp = window.Telegram?.WebApp as TelegramWebApp;
          if (webApp && !isLoading && !preferencesLoaded) {
            const user = webApp.initDataUnsafe?.user;
            const initData = webApp.initData;

            if (user?.id && initData) {
              // prevent overwrite if already loaded
              if (!preferencesLoaded) {
                setIsLoading(true);
                try {
                  await loadPreferencesFromBackend(
                    user.id.toString(),
                    initData
                  );
                  setPreferencesLoaded(true);
                } catch (error) {
                  console.error("Error loading preferences:", error);
                } finally {
                  setIsLoading(false);
                }
              }
            }
          }
        } catch (err) {
          console.error("Error showing settings button:", err);
        }
      }, 0);
    }
  }, [loadPreferencesFromBackend, router, isLoading, preferencesLoaded]);

  // Update button parameters when theme colors change
  useEffect(() => {
    if (typeof window !== "undefined" && setMainButtonParams.isAvailable()) {
      try {
        const isEnabled = !isSubmitting && !isLoading && isDirty;
        const baseColor = colors.primary.startsWith("#")
          ? colors.primary
          : `#${colors.primary}`;

        const enabledColor = colors.surface.startsWith("#")
          ? colors.surface
          : `#${colors.surface}`;

        const enabledTextColor = colors.text.startsWith("#")
          ? colors.text
          : `#${colors.text}`;

        const disabledTextColor = colors.disabled.startsWith("#")
          ? colors.disabled
          : `#${colors.disabled}`;

        // Make background darker when disabled
        const backgroundColor = isEnabled
          ? (baseColor as `#${string}`)
          : (enabledColor as `#${string}`);

        const textColor = isEnabled
          ? (enabledTextColor as `#${string}`)
          : (disabledTextColor as `#${string}`);

        setMainButtonParams({
          backgroundColor,
          isEnabled,
          isLoaderVisible: isSubmitting,
          isVisible: true,
          text: isSubmitting ? "Saving..." : isLoading ? "Loading..." : "Save",
          textColor,
        });
      } catch (err) {
        console.error("Error updating button parameters:", err);
      }
    }
  }, [
    colors.primary,
    colors.text,
    colors.surface,
    colors.disabled,
    isSubmitting,
    isLoading,
    isDirty,
  ]);

  const onSubmit = useCallback(
    async (data: UserPreferences) => {
      try {
        const webApp = window.Telegram?.WebApp as TelegramWebApp;
        const user = webApp.initDataUnsafe?.user;
        const initData = webApp.initData;

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
            ...data,
          }),
        });

        if (!response.ok) {
          console.error("Failed to save preferences:", await response.text());
          return;
        }

        showPopup({
          title: "Success",
          message: "Settings updated successfully",
          buttons: [
            {
              type: "ok",
            },
          ],
        });

        // Mark form as clean after save with the new baseline values
        reset(data, { keepDirty: false });
      } catch (err) {
        console.error("Error saving preferences:", err);
      }
    },
    [reset]
  );

  useEffect(() => {
    if (mainButton && mainButton.onClick) {
      const handleClick = handleSubmit(onSubmit);
      mainButton.onClick(handleClick);

      return () => {
        mainButton.offClick(handleClick);
      };
    }
  }, [handleSubmit, onSubmit]);

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
          onMouseEnter={() => router.prefetch(item.route)}
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
            onMouseEnter={() => router.prefetch(item.route)}
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
