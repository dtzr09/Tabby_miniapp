import {
  backButton,
  init,
  mainButton,
  setMainButtonParams,
} from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Box, Typography, Select, MenuItem, FormControl } from "@mui/material";
import { useTheme } from "../contexts/ThemeContext";
import { useUserPreferences } from "../contexts/UserPreferencesContext";
import { currencies } from "../../utils/preferencesData";
import { getAllCountries, getCountry } from "countries-and-timezones";
import { TelegramWebApp } from "../../utils/types";

// Define UserPreferences interface locally since it's not exported from the context
interface UserPreferences {
  currency: string;
  timezone: string;
  country: string;
}

// Use the interface locally

// Country to currency mapping
const countryToCurrency: { [key: string]: string } = {
  // Major countries and their currencies
  US: "USD", // United States
  GB: "GBP", // United Kingdom
  JP: "JPY", // Japan
  EU: "EUR", // European Union
  CA: "CAD", // Canada
  AU: "AUD", // Australia
  CH: "CHF", // Switzerland
  CN: "CNY", // China
  IN: "INR", // India
  BR: "BRL", // Brazil
  MX: "MXN", // Mexico
  KR: "KRW", // South Korea
  SG: "SGD", // Singapore
  MY: "MYR", // Malaysia
  TH: "THB", // Thailand
  ID: "IDR", // Indonesia
  PH: "PHP", // Philippines
  VN: "VND", // Vietnam
  HK: "HKD", // Hong Kong
  TW: "TWD", // Taiwan
  NZ: "NZD", // New Zealand
  ZA: "ZAR", // South Africa
  RU: "RUB", // Russia
  TR: "TRY", // Turkey
  SA: "SAR", // Saudi Arabia
  AE: "AED", // United Arab Emirates
  IL: "ILS", // Israel
  NO: "NOK", // Norway
  SE: "SEK", // Sweden
  DK: "DKK", // Denmark
  PL: "PLN", // Poland
  CZ: "CZK", // Czech Republic
  HU: "HUF", // Hungary
  RO: "RON", // Romania
  BG: "BGN", // Bulgaria
  HR: "HRK", // Croatia
  RS: "RSD", // Serbia
  // European countries using EUR
  FI: "EUR", // Finland
  PT: "EUR", // Portugal
  ES: "EUR", // Spain
  IT: "EUR", // Italy
  DE: "EUR", // Germany
  FR: "EUR", // France
  NL: "EUR", // Netherlands
  BE: "EUR", // Belgium
  AT: "EUR", // Austria
  IE: "EUR", // Ireland
  GR: "EUR", // Greece
  CY: "EUR", // Cyprus
  MT: "EUR", // Malta
  LU: "EUR", // Luxembourg
  SK: "EUR", // Slovakia
  SI: "EUR", // Slovenia
  EE: "EUR", // Estonia
  LV: "EUR", // Latvia
  LT: "EUR", // Lithuania
  // Additional countries
  // Additional countries
  EG: "EGP", // Egypt
  NG: "NGN", // Nigeria
  KE: "KES", // Kenya
  GH: "GHS", // Ghana
  UA: "UAH", // Ukraine
  UY: "UYU", // Uruguay
  CL: "CLP", // Chile
  CO: "COP", // Colombia
  PE: "PEN", // Peru
  AR: "ARS", // Argentina
};

const Settings = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    preferences,
    updateCurrency,
    updateTimezone,
    updateCountry,
    updatePreferences,
    syncPreferencesWithBackend,
    loadPreferencesFromBackend,
  } = useUserPreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [originalPreferences, setOriginalPreferences] =
    useState<UserPreferences>({
      currency: "USD",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: "SG",
    });
  const [hasChanges, setHasChanges] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Get all countries and sort them by name
  const countries = getAllCountries();
  const sortedCountries = Object.values(countries).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Default to Singapore if no country is set
  const currentCountryCode = preferences.country || "SG";

  // Check if current country code is valid
  const isValidCountry = sortedCountries.some(
    (c) => c.id === currentCountryCode
  );

  // Log when currentCountryCode changes
  useEffect(() => {
    console.log("currentCountryCode changed to:", currentCountryCode);
  }, [currentCountryCode]);

  // Log when preferences change
  useEffect(() => {
    console.log("preferences changed:", preferences);
  }, [preferences]);

  // Update original preferences when preferences are loaded from backend
  useEffect(() => {
    if (!isLoading && preferencesLoaded) {
      console.log("Updating original preferences:", preferences);
      setOriginalPreferences(preferences);
    }
  }, [preferences, isLoading, preferencesLoaded]);

  // Track changes when preferences change
  useEffect(() => {
    const hasCurrencyChanged =
      preferences.currency !== originalPreferences.currency;
    const hasTimezoneChanged =
      preferences.timezone !== originalPreferences.timezone;
    const hasCountryChanged =
      preferences.country !== originalPreferences.country;

    console.log("Change tracking:", {
      hasCurrencyChanged,
      hasTimezoneChanged,
      hasCountryChanged,
      preferences: preferences,
      originalPreferences: originalPreferences,
    });

    setHasChanges(
      hasCurrencyChanged || hasTimezoneChanged || hasCountryChanged
    );
  }, [preferences, originalPreferences]);

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
        setMainButtonParams({
          backgroundColor: (colors.primary.startsWith("#")
            ? colors.primary
            : `#${colors.primary}`) as `#${string}`,
          isEnabled: !isSaving && !isLoading && hasChanges,
          isLoaderVisible: isSaving,
          isVisible: true,
          text: isSaving ? "Saving..." : isLoading ? "Loading..." : "Save",
          textColor: (colors.text.startsWith("#")
            ? colors.text
            : `#${colors.text}`) as `#${string}`,
        });
      } catch (err) {
        console.error("Error updating button parameters:", err);
      }
    }
  }, [colors.primary, colors.text, isSaving, isLoading, hasChanges]);

  // Handle main button click
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleMainButtonClick = async () => {
        if (isSaving) return;

        setIsSaving(true);

        try {
          // Get Telegram WebApp data
          const webApp = window.Telegram?.WebApp as TelegramWebApp;
          if (!webApp) {
            console.error("Telegram WebApp not available");
            return;
          }

          const user = webApp.initDataUnsafe?.user;
          const initData = webApp.initData;

          if (!user?.id || !initData) {
            console.error("Missing user data or init data");
            return;
          }

          // Sync preferences with backend
          const success = await syncPreferencesWithBackend(
            user.id.toString(),
            initData
          );

          if (success) {
            // Update original preferences to reset change tracking
            setOriginalPreferences(preferences);
            setHasChanges(false);
          }
        } catch (error) {
          console.error("Error saving preferences:", error);
        } finally {
          setIsSaving(false);
        }
      };

      // Add main button click handler
      if (mainButton && mainButton.onClick) {
        mainButton.onClick(handleMainButtonClick);
      }

      // Cleanup
      return () => {
        if (mainButton && mainButton.offClick) {
          mainButton.offClick(handleMainButtonClick);
        }
      };
    }
  }, [syncPreferencesWithBackend, isSaving, isLoading, preferences]);

  // Check if countries data is available
  if (!countries || Object.keys(countries).length === 0) {
    console.error("Countries data is not available");
    return <div>Loading countries...</div>;
  }

  console.log("Countries data:", {
    totalCountries: Object.keys(countries).length,
    sortedCountriesCount: sortedCountries.length,
    sampleCountries: sortedCountries
      .slice(0, 5)
      .map((c) => ({ id: c.id, name: c.name })),
    firstCountry: sortedCountries[0],
    sgCountry: sortedCountries.find((c) => c.id === "SG"),
    usCountry: sortedCountries.find((c) => c.id === "US"),
    allCountryIds: sortedCountries.slice(0, 10).map((c) => c.id),
    countryMappingKeys: Object.keys(countryToCurrency).slice(0, 10),
  });

  console.log("Country validation:", {
    currentCountryCode,
    isValidCountry,
    availableCountries: sortedCountries.slice(0, 5).map((c) => c.id),
  });

  console.log("Settings page state:", {
    preferences,
    currentCountryCode,
    originalPreferences,
    hasChanges,
    preferencesLoaded,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCurrencyChange = (event: any) => {
    const newCurrency = event.target.value as string;
    updateCurrency(newCurrency);
  };

  const handleCountryChange = (newCountryCode: string) => {
    console.log("handleCountryChange called with:", newCountryCode);

    // Test getCountry function
    const testCountry = getCountry("US");
    console.log("Test getCountry('US'):", testCountry);

    const newCountry = getCountry(newCountryCode);

    console.log("Country change triggered:", {
      newCountryCode,
      newCountry,
      currentPreferences: preferences,
    });

    if (newCountry && newCountry.timezones && newCountry.timezones.length > 0) {
      // Use the first timezone of the country
      const newTimezone = newCountry.timezones[0];
      console.log(
        "Updating country to:",
        newCountryCode,
        "timezone to:",
        newTimezone
      );
      updateCountry(newCountryCode);
      updateTimezone(newTimezone);

      // Auto-update currency based on country
      const countryCurrency = countryToCurrency[newCountryCode];
      if (countryCurrency) {
        // Check if the currency is available in our supported currencies
        const isCurrencySupported = currencies.some(
          (c) => c.code === countryCurrency
        );
        if (isCurrencySupported) {
          console.log("Auto-updating currency to:", countryCurrency);
          updateCurrency(countryCurrency);
        } else {
          console.log("Currency not supported:", countryCurrency);
        }
      } else {
        console.log("No currency mapping found for country:", newCountryCode);
      }
    } else {
      console.log("Invalid country or no timezones found:", newCountryCode);
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
        {/* Country Section */}
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
            <Select
              value={preferences.country || "SG"}
              onChange={(event) => {
                console.log("Select onChange triggered:", event.target.value);
                const newCountryCode = event.target.value as string;
                handleCountryChange(newCountryCode);
              }}
              disabled={isLoading}
              displayEmpty
              renderValue={(value) => {
                const country = sortedCountries.find((c) => c.id === value);
                return country ? country.name : value;
              }}
              sx={{
                color: colors.text,
                background: colors.card,
                borderRadius: 1,
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
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
                      "&:hover": {
                        background: colors.surface,
                      },
                      "&.Mui-selected": {
                        background: colors.primary,
                        color: colors.text,
                        "&:hover": {
                          background: colors.primary,
                        },
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
            <Select
              value={preferences.currency || "USD"}
              onChange={handleCurrencyChange}
              disabled={isLoading}
              displayEmpty
              sx={{
                color: colors.text,
                background: colors.card,
                borderRadius: 1,
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
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
                      "&:hover": {
                        background: colors.surface,
                      },
                      "&.Mui-selected": {
                        background: colors.primary,
                        color: colors.text,
                        "&:hover": {
                          background: colors.primary,
                        },
                      },
                    },
                  },
                },
              }}
            >
              {currencies.map((currency) => (
                <MenuItem key={currency.code} value={currency.code}>
                  <Typography sx={{ color: "inherit" }}>
                    {currency.code} - {currency.name}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Debug Section */}
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
            DEBUG
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <button
              onClick={() => {
                console.log("Test button clicked");
                updateCountry("US");
                updateCurrency("USD");
                console.log("After update - preferences should be:", {
                  country: "US",
                  currency: "USD",
                });
              }}
              style={{
                padding: "8px 16px",
                background: colors.primary,
                color: colors.text,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Test US
            </button>
            <button
              onClick={() => {
                console.log("Test button clicked");
                updateCountry("GB");
                updateCurrency("GBP");
                console.log("After update - preferences should be:", {
                  country: "GB",
                  currency: "GBP",
                });
              }}
              style={{
                padding: "8px 16px",
                background: colors.primary,
                color: colors.text,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Test GB
            </button>
            <button
              onClick={() => {
                console.log("Direct state test");
                updatePreferences({ country: "JP", currency: "JPY" });
              }}
              style={{
                padding: "8px 16px",
                background: colors.primary,
                color: colors.text,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Direct State Test
            </button>
          </Box>
          <Box
            sx={{ mt: 1, p: 1, background: colors.surface, borderRadius: 1 }}
          >
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              Current State: {JSON.stringify(preferences, null, 2)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
