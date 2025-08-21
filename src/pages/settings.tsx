import {
  backButton,
  mainButton,
  setMainButtonParams,
  showPopup,
} from "@telegram-apps/sdk";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Box, Typography, Skeleton, Chip, Menu, MenuItem } from "@mui/material";
import { useTheme } from "../contexts/ThemeContext";
import { currencies } from "../../utils/preferencesData";
import { Country, getAllCountries } from "countries-and-timezones";
import countryToCurrency from "country-to-currency";
import { useForm, Controller } from "react-hook-form";
import { SettingsLayout } from "../../components/settings/SettingsLayout";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { SettingsItem } from "../../components/settings/SettingsItem";
import { useTelegramWebApp } from "../../hooks/useTelegramWebApp";
import { SelectionList } from "../../components/settings/SelectionList";
import CategoriesSettings from "./settings/categories";
import { Group } from "../../utils/types";

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
      getValue: (field: { value: string }) => field.value || "SGD",
    },
  ] as SettingsItemConfig[],
  data: [
    {
      key: "categories",
      title: "Categories",
      icon: "📋",
      iconBg: "#5856D6",
    },
  ] as SettingsItemConfig[],
};

const Settings = () => {
  const router = useRouter();
  const [chat_id, setChatId] = useState<string | null>(null);
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<SettingsView>("main");
  const [selectedCountry, setSelectedCountry] = useState("SG");
  const [selectedCurrency, setSelectedCurrency] = useState("SGD");
  const [initialLoad, setInitialLoad] = useState(true);
  // const [isGroupSettings, setIsGroupSettings] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

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

  const { control, reset } = useForm<UserPreferences>({
    defaultValues,
    mode: "onChange",
  });

  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [filterDataLoaded, setFilterDataLoaded] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);

  // Initialize chat_id from URL query on mount
  useEffect(() => {
    if (router.isReady && router.query.chat_id) {
      setChatId(router.query.chat_id as string);
    }
  }, [router.isReady, router.query.chat_id]);

  // Update isGroupSettings when chat_id changes
  useEffect(() => {
    // setIsGroupSettings(!!chat_id);
    // Reset state when switching between personal and group
    setPreferencesLoaded(false);
    setGroupName(null);
    setInitialLoad(true);
  }, [chat_id]);

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

  // Load available groups
  const loadAvailableGroups = useCallback(
    async (telegram_id: string, initData: string): Promise<void> => {
      try {
        const params = new URLSearchParams({
          telegram_id,
          initData,
        });

        const response = await fetch(`/api/groups?${params.toString()}`);
        if (response.ok) {
          const groups = await response.json();
          setAvailableGroups(groups);
        }
      } catch (error) {
        console.error("❌ Error loading groups:", error);
      }
    },
    []
  );

  // Load group name if in group mode
  const loadGroupName = useCallback(
    async (
      chatId: string,
      telegram_id: string,
      initData: string
    ): Promise<void> => {
      try {
        const params = new URLSearchParams({
          telegram_id,
          initData,
        });

        const response = await fetch(
          `/api/groups/${chatId}?${params.toString()}`
        );
        if (response.ok) {
          const group = await response.json();
          if (group && group.length > 0) {
            setGroupName(group[0].name || group[0].title || "Group");
          }
        }
      } catch (error) {
        console.error("❌ Error loading group name:", error);
      }
    },
    []
  );

  // Load preferences from backend
  const loadPreferencesFromBackend = useCallback(
    async (telegram_id: string, initData: string): Promise<boolean> => {
      try {
        const params = new URLSearchParams({
          telegram_id,
          initData,
        });

        if (chat_id) {
          params.append("chat_id", chat_id as string);
        }

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
    [reset, defaultValues, chat_id]
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
        router.push("/");
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
        // Load preferences
        await loadPreferencesFromBackend(user.id.toString(), initData);

        // Load available groups
        await loadAvailableGroups(user.id.toString(), initData);

        // Load current group name if in group mode
        if (chat_id) {
          await loadGroupName(chat_id as string, user.id.toString(), initData);
        }

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
    loadAvailableGroups,
    loadGroupName,
    chat_id,
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
          chat_id?: string;
        } = {
          telegram_id: user.id.toString(),
          initData,
          country: countryId,
        };

        if (chat_id) {
          updateData.chat_id = chat_id as string;
        }

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
    [
      user,
      initData,
      filteredCountries,
      selectedCurrency,
      defaultValues,
      reset,
      chat_id,
    ]
  );

  const handleCurrencySelect = useCallback(
    async (currencyCode: string) => {
      setSelectedCurrency(currencyCode);

      try {
        if (!user?.id || !initData) {
          console.error("Missing Telegram user/init data");
          return;
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
        };

        if (chat_id) {
          updateData.chat_id = chat_id as string;
        }

        const response = await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
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
    [user, initData, defaultValues, selectedCountry, reset, chat_id]
  );

  // View handlers
  const handleViewChange = useCallback((view: SettingsView) => {
    setCurrentView(view);
  }, []);

  // Group switcher state
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Handler for group selection
  const handleGroupMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setGroupMenuAnchor(event.currentTarget);
    },
    []
  );

  const handleGroupMenuClose = useCallback(() => {
    setGroupMenuAnchor(null);
  }, []);

  const handleGroupSelect = useCallback(
    (groupId: string | null) => {
      setChatId(groupId);
      handleGroupMenuClose();
    },
    [handleGroupMenuClose]
  );

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
          component: <CategoriesSettings chat_id={chat_id} />,
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
              showBorder={!isLast}
            />
          )}
        />
      );
    },
    [control, filteredCountries, handleViewChange]
  );

  // Create the group switcher chip
  const groupSwitcherChip = useMemo(() => {
    if (availableGroups.length === 0) return null;

    // Get the current group name
    const currentGroupName = chat_id
      ? groupName ||
        availableGroups.find((g) => g.chat_id === chat_id)?.name ||
        availableGroups.find((g) => g.chat_id === chat_id)?.title ||
        "Group"
      : "Personal";

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Chip
          label={currentGroupName}
          onClick={handleGroupMenuOpen}
          sx={{
            bgcolor: colors.card,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            fontSize: "0.75rem",
            height: "28px",
            "&:hover": {
              bgcolor: colors.surface,
            },
          }}
          clickable
        />
        <Menu
          anchorEl={groupMenuAnchor}
          open={Boolean(groupMenuAnchor)}
          onClose={handleGroupMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          slotProps={{
            paper: {
              sx: {
                bgcolor: colors.card,
                borderColor: colors.border,
                boxShadow: `0 2px 4px -1px ${colors.border}`,
                borderRadius: 3,
                minWidth: 100,
                mt: 0.5,
                py: 0.25,
              },
            },
          }}
        >
          <MenuItem
            onClick={() => handleGroupSelect(null)}
            selected={!chat_id}
            sx={{
              color: colors.text,
              fontSize: "0.75rem",
              py: 0.5,
              px: 1,
              minHeight: "auto",
              borderRadius: 2,
              mx: 0.5,
              "&.Mui-selected": {
                bgcolor: colors.incomeExpenseCard,
                color: colors.text,
                "&:hover": {
                  bgcolor: colors.incomeExpenseCard,
                },
              },
              "&:hover": {
                bgcolor: colors.surface,
              },
            }}
          >
            Personal
          </MenuItem>
          {availableGroups.map((group) => (
            <MenuItem
              key={group.chat_id}
              onClick={() => handleGroupSelect(group.chat_id)}
              selected={chat_id === group.chat_id}
              sx={{
                color: colors.text,
                fontSize: "0.75rem",
                py: 0.5,
                px: 1,
                minHeight: "auto",
                borderRadius: 2,
                mx: 0.5,
                "&.Mui-selected": {
                  bgcolor: colors.incomeExpenseCard,
                  color: colors.text,
                  "&:hover": {
                    bgcolor: colors.incomeExpenseCard,
                  },
                },
                "&:hover": {
                  bgcolor: colors.surface,
                },
              }}
            >
              {group.name || group.title}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }, [
    availableGroups,
    chat_id,
    groupName,
    colors,
    handleGroupMenuOpen,
    groupMenuAnchor,
    handleGroupMenuClose,
    handleGroupSelect,
  ]);

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
      <SettingsLayout
        title={viewConfig.title}
        headerExtra={currentView === "main" ? groupSwitcherChip : null}
      >
        {viewConfig.component}
      </SettingsLayout>
    );
  }

  // Main settings view
  return (
    <SettingsLayout title="Settings" headerExtra={groupSwitcherChip}>
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
