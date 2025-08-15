import {
  backButton,
  init,
  mainButton,
  setMainButtonParams,
  showPopup,
} from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Skeleton,
} from "@mui/material";
import { useTheme } from "../contexts/ThemeContext";
import { currencies } from "../../utils/preferencesData";
import { Country, getAllCountries, getCountry } from "countries-and-timezones";
import { TelegramWebApp } from "../../utils/types";
import countryToCurrency from "country-to-currency";
import { useForm, Controller } from "react-hook-form";

// Define UserPreferences interface locally since it's not exported from the context
interface UserPreferences {
  currency: string;
  timezone: string;
  country: string;
}

const Settings = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues: UserPreferences = {
    currency: "SGD",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    country: "SG",
  };

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isDirty, isSubmitting },
    reset,
  } = useForm<UserPreferences>({
    defaultValues,
    mode: "onChange",
  });

  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Get all countries and sort them by name
  const countries = getAllCountries();
  const sortedCountries = Object.values(countries).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const [filterDataLoaded, setFilterDataLoaded] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState<
    typeof currencies
  >([]);

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

    const pairedCurrencyCodes = new Set<string>(
      Object.values(countryToCurrency)
    );

    const validCurrencies = currencies.filter((c) =>
      pairedCurrencyCodes.has(c.code)
    );

    setFilteredCountries(validCountries);
    setFilteredCurrencies(validCurrencies);
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

          backButton.onClick(() => {
            router.push("/");
          });

          mainButton.mount();

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

  if (
    !countries ||
    Object.keys(countries).length === 0 ||
    !filterDataLoaded ||
    !preferencesLoaded ||
    isLoading
  ) {
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

  const handleCountryChange = (newCountryCode: string) => {
    const newCountry = getCountry(newCountryCode);

    if (newCountry && newCountry.timezones && newCountry.timezones.length > 0) {
      // Use the first timezone of the country
      const newTimezone = newCountry.timezones[0];

      setValue("country", newCountry.id, { shouldDirty: true });
      setValue("timezone", newTimezone, { shouldDirty: true });

      // Auto-update currency based on country
      const countryCurrency =
        countryToCurrency[newCountryCode as keyof typeof countryToCurrency];
      if (countryCurrency) {
        // Check if the currency is available in our supported currencies
        const isCurrencySupported = currencies.some(
          (c) => c.code === countryCurrency
        );
        if (isCurrencySupported) {
          setValue("currency", countryCurrency, { shouldDirty: true });
        }
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: colors.background,
        px: 2,
        py: 1,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: colors.primary,
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 1,
            }}
          >
            COUNTRY
          </Typography>
          <FormControl fullWidth>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || "SG"}
                  onChange={(event) => {
                    const newCountryCode = event.target.value.toUpperCase();
                    field.onChange(newCountryCode);
                    handleCountryChange(newCountryCode);
                  }}
                  disabled={isLoading}
                  displayEmpty
                  renderValue={(value) => {
                    const country = filteredCountries.find(
                      (c) => c.id === value
                    );
                    return country ? country.name : value;
                  }}
                  sx={{
                    color: colors.text,
                    background: colors.inputBg,
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "& .MuiSelect-icon": {
                      color: colors.textSecondary,
                    },
                    "& .MuiSelect-select": {
                      padding: "12px 16px",
                    },
                    "& .MuiMenu-paper": {
                      background: colors.card,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        background: colors.card,
                        "& .MuiMenuItem-root": {
                          color: colors.text,
                          "&.Mui-selected": {
                            background: colors.primary,
                            color: colors.text,
                          },
                        },
                      },
                    },
                  }}
                >
                  {sortedCountries.map((country) => (
                    <MenuItem key={country.id} value={country.id}>
                      <Typography sx={{ color: "inherit" }}>
                        {country.name}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Box>

        {/* Currency Section */}
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: colors.primary,
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 1,
            }}
          >
            CURRENCY
          </Typography>
          <FormControl fullWidth>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || "SGD"}
                  onChange={field.onChange}
                  disabled={isLoading}
                  displayEmpty
                  sx={{
                    color: colors.text,
                    background: colors.inputBg,
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                    "& .MuiSelect-icon": {
                      color: colors.textSecondary,
                    },
                    "& .MuiSelect-select": {
                      padding: "12px 16px",
                    },
                    "& .MuiMenu-paper": {
                      background: colors.card,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        background: colors.card,
                        "& .MuiMenuItem-root": {
                          color: colors.text,
                          "&.Mui-selected": {
                            background: colors.primary,
                            color: colors.text,
                          },
                        },
                      },
                    },
                  }}
                >
                  {filteredCurrencies.map((currency) => (
                    <MenuItem key={currency.code} value={currency.code}>
                      <Typography sx={{ color: "inherit" }}>
                        {currency.code} - {currency.name}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
