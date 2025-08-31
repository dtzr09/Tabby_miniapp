import { useCallback, useMemo, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showPopup } from "@telegram-apps/sdk";
import { getAllCountries, Country } from "countries-and-timezones";
import countryToCurrency from "country-to-currency";
import { currencies } from "../utils/preferencesData";
import { fetchPreferences } from "../services/preferences";
import { useTelegramWebApp } from "./useTelegramWebApp";

export interface UserPreferences {
  currency: string;
  timezone: string;
  country: string;
}

export const usePreferences = (chat_id?: string | null) => {
  const queryClient = useQueryClient();
  const { user, initData, isReady } = useTelegramWebApp();
  const isGroup = chat_id && chat_id !== user?.id?.toString();

  const [initialLoad, setInitialLoad] = useState(true);
  const [filterDataLoaded, setFilterDataLoaded] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);

  const defaultValues: UserPreferences = useMemo(
    () => ({
      currency: "SGD",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: "SG",
    }),
    []
  );

  // Fetch preferences data
  const {
    data: preferencesData,
    isLoading: preferencesLoading,
    isFetching,
  } = useQuery({
    queryKey: ["preferences", user?.id, chat_id],
    queryFn: () => {
      console.log("🌐 Settings making fresh API call for preferences", {
        userId: user?.id?.toString(),
        chatId: isGroup ? chat_id : undefined,
      });
      return fetchPreferences(user!.id.toString(), initData!, chat_id);
    },
    enabled: !!(user?.id && initData && isReady),
    staleTime: 10 * 60 * 1000, // 10 minutes - matches dashboard prefetch
  });

  // Initialize filtered countries
  useEffect(() => {
    const allCountries = getAllCountries();
    const supportedCurrencyCodes = new Set(
      currencies.map((c) => c.code as keyof typeof countryToCurrency)
    );

    const validCountries = Object.values(allCountries)
      .filter((country) => {
        const currency =
          countryToCurrency[country.id as keyof typeof countryToCurrency];
        return (
          currency &&
          supportedCurrencyCodes.has(currency as keyof typeof countryToCurrency)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    setFilteredCountries(validCountries);
    setFilterDataLoaded(true);
  }, []);

  // Update form data when preferences are loaded
  useEffect(() => {
    if (preferencesData) {
      console.log("🔍 Raw preferences data from API:", preferencesData);

      const formData = {
        currency: preferencesData.currency || defaultValues.currency,
        timezone: preferencesData.timezone || defaultValues.timezone,
        country: preferencesData.country || defaultValues.country,
      };

      reset(formData);
      setInitialLoad(false);
    }
  }, [preferencesData, defaultValues]);

  // Derive current form values from API data - no useEffect needed
  const currentFormValues = useMemo(() => {
    if (!preferencesData) return defaultValues;

    return {
      currency: preferencesData.currency || defaultValues.currency,
      timezone: preferencesData.timezone || defaultValues.timezone,
      country: preferencesData.country || defaultValues.country,
    };
  }, [preferencesData, defaultValues]);

  // Selected values derived from current form values
  const selectedCountry = currentFormValues.country;
  const selectedCurrency = currentFormValues.currency;

  // Update form control to use current values
  const { control, reset } = useForm<UserPreferences>({
    values: currentFormValues, // Use values instead of defaultValues to keep form synced
    mode: "onChange",
  });

  // Country selection handler
  const handleCountrySelect = useCallback(
    async (countryId: string) => {
      try {
        if (!user?.id || !initData) {
          console.error("Missing Telegram user/init data");
          return false;
        }

        const country = filteredCountries.find((c) => c.id === countryId);
        let updateData: {
          telegram_id: string;
          initData: string;
          country: string;
          timezone?: string;
          currency?: string;
          chat_id?: string;
        } = {
          telegram_id: user.id.toString(),
          initData,
          country: countryId,
          chat_id: isGroup ? chat_id : undefined,
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
            }
          }
        }

        const response = await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          // Invalidate and refetch preferences cache
          await queryClient.invalidateQueries({
            queryKey: ["preferences", user.id, chat_id],
          });

          return true; // Success
        } else {
          console.error("Failed to save preferences:", await response.text());
          showPopup({
            title: "Error",
            message: "Failed to update country",
            buttons: [{ type: "ok" }],
          });
          return false;
        }
      } catch (err) {
        console.error("Error saving country:", err);
        showPopup({
          title: "Error",
          message: "Failed to update country",
          buttons: [{ type: "ok" }],
        });
        return false;
      }
    },
    [user, initData, filteredCountries, chat_id, queryClient, isGroup]
  );

  // Currency selection handler
  const handleCurrencySelect = useCallback(
    async (currencyCode: string) => {
      try {
        if (!user?.id || !initData) {
          console.error("Missing Telegram user/init data");
          return false;
        }

        const updateData: {
          telegram_id: string;
          initData: string;
          currency: string;
          chat_id?: string;
        } = {
          telegram_id: user.id.toString(),
          initData,
          currency: currencyCode,
          chat_id: isGroup ? chat_id : undefined,
        };

        const response = await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          // Invalidate and refetch preferences cache
          await queryClient.invalidateQueries({
            queryKey: ["preferences", user.id, chat_id],
          });

          return true; // Success
        } else {
          console.error("Failed to save preferences:", await response.text());
          showPopup({
            title: "Error",
            message: "Failed to update currency",
            buttons: [{ type: "ok" }],
          });
          return false;
        }
      } catch (err) {
        console.error("Error saving currency:", err);
        showPopup({
          title: "Error",
          message: "Failed to update currency",
          buttons: [{ type: "ok" }],
        });
        return false;
      }
    },
    [user, initData, chat_id, queryClient, isGroup]
  );

  return {
    // Data
    preferencesData,
    filteredCountries,
    selectedCountry,
    selectedCurrency,

    // State
    isLoading: preferencesLoading || !filterDataLoaded,
    isFetching,
    initialLoad,

    // Form
    control,
    reset,

    // Handlers
    handleCountrySelect,
    handleCurrencySelect,
  };
};
