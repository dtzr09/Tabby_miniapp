import {
  backButton,
  init,
  mainButton,
  setMainButtonParams,
  showPopup,
} from "@telegram-apps/sdk";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Box, Typography, Skeleton, Chip, Menu, MenuItem } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { currencies } from "../../utils/preferencesData";
import { Country, getAllCountries } from "countries-and-timezones";
import countryToCurrency from "country-to-currency";
import { useForm, Controller } from "react-hook-form";
import { AppLayout } from "../AppLayout";
import { SettingsSection } from "./SettingsSection";
import { SettingsItem } from "./SettingsItem";
import { useTelegramWebApp } from "../../hooks/useTelegramWebApp";
import { SelectionList } from "./SelectionList";
import CategoriesSettings from "../../src/pages/settings/categories";
import { useQuery } from "@tanstack/react-query";
import { fetchPreferences } from "../../services/preferences";
import { fetchGroups } from "../../services/group";
import { Group } from "../../utils/types";
import { loadNavigationState } from "../../utils/navigationState";

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

type SettingsView = "main" | "country" | "currency" | "categories" | "theme";

interface ViewConfig {
  title: string;
  component: React.ReactNode;
}

interface SettingsProps {
  onViewChange: (view: "dashboard" | "settings") => void;
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
    {
      key: "theme",
      title: "Appearance",
      icon: "🎨",
      iconBg: "#FF9500",
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

const Settings = ({ onViewChange }: SettingsProps) => {
  const { colors, isDark, currentTheme, setTheme } = useTheme();
  const [chat_id, setChatId] = useState<string | null>(null);
  const [isLoading] = useState(false);
  const [currentView, setCurrentView] = useState<SettingsView>("main");
  const [selectedCountry, setSelectedCountry] = useState("SG");
  const [selectedCurrency, setSelectedCurrency] = useState("SGD");
  const [initialLoad, setInitialLoad] = useState(true);
  const [groupName, setGroupName] = useState<string | null>(null);

  // Use optimized Telegram WebApp hook
  const { user, initData, isReady } = useTelegramWebApp();

  // Initialize chat_id from Dashboard's navigation state to match cache keys
  useEffect(() => {
    if (user?.id && chat_id === null) {
      // Load the same navigation state that Dashboard uses
      const savedState = loadNavigationState();
      const selectedGroupId = savedState?.selectedGroupId || user.id.toString();
      
      console.log("🔧 Settings initializing chat_id from navigation state:", {
        savedSelectedGroupId: savedState?.selectedGroupId,
        fallbackToUserId: user.id.toString(),
        finalChatId: selectedGroupId
      });
      
      setChatId(selectedGroupId);
    }
  }, [user?.id, chat_id]);

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

  const [filterDataLoaded, setFilterDataLoaded] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);

  // Use React Query for data fetching to leverage prefetched data from dashboard
  const { data: preferencesData, isLoading: preferencesLoading, isFetching } = useQuery({
    queryKey: ["preferences", user?.id?.toString(), chat_id],
    queryFn: () => {
      console.log("🌐 Settings making fresh API call for preferences", {
        userId: user?.id?.toString(),
        chatId: chat_id
      });
      return fetchPreferences(user!.id.toString(), initData!, chat_id);
    },
    enabled: !!(user?.id && initData && isReady),
    staleTime: 10 * 60 * 1000, // 10 minutes - matches dashboard prefetch
  });

  // Log whether we're using cached data or fetching fresh
  useEffect(() => {
    if (user?.id && chat_id !== null) {
      const queryKey = ["preferences", user.id.toString(), chat_id];
      console.log("🔍 Settings preferences query:", {
        queryKey,
        isLoading: preferencesLoading,
        isFetching,
        hasData: !!preferencesData,
        status: isFetching ? "FETCHING" : preferencesData ? "USING_CACHE" : "NO_DATA"
      });
    }
  }, [user?.id, chat_id, preferencesLoading, isFetching, preferencesData]);

  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ["groupsWithExpenses", user?.id],
    queryFn: () => fetchGroups(user!.id.toString(), initData!),
    enabled: !!(user?.id && initData && isReady),
    staleTime: 10 * 60 * 1000, // 10 minutes - matches dashboard prefetch
  });

  // Use grouped data directly from React Query with useMemo to prevent re-renders
  const availableGroups = useMemo(() => groupsData || [], [groupsData]);

  // Initialize chat_id from URL query on mount (if we still need this)
  // For now, we'll start with null and handle group switching internally

  // Update form data when preferences are loaded
  useEffect(() => {
    if (preferencesData) {
      const formData = {
        currency: preferencesData.currency || defaultValues.currency,
        timezone: preferencesData.timezone || defaultValues.timezone,
        country: preferencesData.country || defaultValues.country,
      };

      reset(formData);
      setSelectedCountry(formData.country);
      setSelectedCurrency(formData.currency);
      setInitialLoad(false);
    }
  }, [preferencesData, defaultValues, reset]);

  // Update group name when groups change or chat_id changes
  useEffect(() => {
    if (chat_id && availableGroups.length > 0) {
      const currentGroup = availableGroups.find(
        (g: Group) => g.chat_id === chat_id
      );
      setGroupName(currentGroup?.name || currentGroup?.title || "Group");
    } else {
      setGroupName(null);
    }
  }, [chat_id, availableGroups]);

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

  // Telegram UI setup - mount and show back button in settings
  useEffect(() => {
    if (!isReady) return;

    try {
      init(); // Initialize Telegram WebApp
      backButton.mount(); // Mount back button
      backButton.show(); // Show back button

      // Hide main button in settings
      if (!mainButton.isMounted()) {
        mainButton.mount();
      }
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
        onViewChange("dashboard");
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
  }, [isReady, onViewChange, currentView]);

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

      case "theme":
        const themeItems = [
          { id: "auto", label: "System" },
          { id: "light", label: "Light" },
          { id: "dark", label: "Dark" },
        ];
        return {
          title: "Appearance",
          component: (
            <SelectionList
              items={themeItems}
              selectedId={currentTheme}
              onSelect={(themeId) => {
                // Handle theme selection
                setTheme(themeId as "light" | "dark" | "auto");
                setCurrentView("main");
              }}
              isLoading={false}
              skeletonCount={3}
            />
          ),
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
    chat_id,
    currentTheme,
    setTheme,
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

      if (item.key === "theme") {
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
            value={
              currentTheme === "auto"
                ? `System (${isDark ? "Dark" : "Light"})`
                : currentTheme === "dark"
                ? "Dark"
                : "Light"
            } // Show current theme
            onClick={() => handleViewChange("theme")}
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
    [control, filteredCountries, handleViewChange, isDark, currentTheme]
  );

  // Create the group switcher chip
  const groupSwitcherChip = useMemo(() => {
    if (availableGroups.length === 0) return null;

    // Get the current group name
    const currentGroupName = chat_id && chat_id !== user?.id?.toString()
      ? groupName ||
        availableGroups.find((g: Group) => g.chat_id === chat_id)?.name ||
        availableGroups.find((g: Group) => g.chat_id === chat_id)?.title ||
        "Group"
      : "Personal";

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Chip
          label={currentGroupName}
          onClick={handleGroupMenuOpen}
          sx={{
            color: colors.text,
            border: `1px solid ${colors.border}`,
            fontSize: "0.75rem",
            height: "28px",
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
            onClick={() => handleGroupSelect(user?.id?.toString() || null)}
            selected={!chat_id || chat_id === user?.id?.toString()}
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
          {availableGroups.map((group: Group) => (
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
  if (!filterDataLoaded || preferencesLoading || groupsLoading || isLoading) {
    return (
      <AppLayout title="Settings">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height={60}
            sx={{ borderRadius: 2, bgcolor: colors.card }}
          />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={60}
            sx={{ borderRadius: 2, bgcolor: colors.card }}
          />
        </Box>
      </AppLayout>
    );
  }

  // Render sub-views
  const viewConfig = getViewConfig();
  if (viewConfig) {
    return (
      <AppLayout
        title={viewConfig.title}
        headerExtra={currentView === "main" ? groupSwitcherChip : null}
      >
        {viewConfig.component}
      </AppLayout>
    );
  }

  // Main settings view
  return (
    <AppLayout title="Settings" headerExtra={groupSwitcherChip}>
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
    </AppLayout>
  );
};

export default Settings;
