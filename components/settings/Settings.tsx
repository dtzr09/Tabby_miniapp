import {
  backButton,
  init,
  mainButton,
  setMainButtonParams,
} from "@telegram-apps/sdk";
import React, { useCallback, useEffect, useState } from "react";
import { Box, Typography, Skeleton } from "@mui/material";
import { useTheme } from "../../src/contexts/ThemeContext";
import { currencies } from "../../utils/preferencesData";
import { Controller } from "react-hook-form";
import { AppLayout } from "../AppLayout";
import { SettingsSection } from "./SettingsSection";
import { SettingsItem } from "./SettingsItem";
import { useTelegramWebApp } from "../../hooks/useTelegramWebApp";
import { SelectionList } from "./SelectionList";
import CategoriesSettings from "../../src/pages/settings/categories";
import NotificationsSettings from "./NotificationsSettings";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGroups } from "../../services/group";
import { Group } from "../../utils/types";
import { loadNavigationState } from "../../utils/navigationState";
import { usePreferences } from "../../hooks/usePreferences";
import { SettingsView, UserPreferences, ViewConfig } from "./utils/types";
import { SETTINGS_CONFIG, SettingsItemConfig } from "./utils/configuration";
import GroupSwitcherChip from "./GroupSwitcherChip";

interface SettingsProps {
  onViewChange: (view: "dashboard" | "settings") => void;
}

const Settings = ({ onViewChange }: SettingsProps) => {
  const { colors, isDark, currentTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [chat_id, setChatId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<SettingsView>("main");
  const [groupName, setGroupName] = useState<string | null>(null);

  // Use optimized Telegram WebApp hook
  const { user, initData, isReady, error } = useTelegramWebApp();

  // Use preferences hook - MUST be called before any early returns
  const {
    filteredCountries,
    selectedCountry,
    selectedCurrency,
    isLoading: preferencesLoading,
    initialLoad,
    control,
    handleCountrySelect,
    handleCurrencySelect,
    preferencesData,
  } = usePreferences(chat_id);

  // Initialize chat_id from Dashboard's navigation state to match cache keys
  useEffect(() => {
    if (user?.id && chat_id === null) {
      // Load the same navigation state that Dashboard uses
      const savedState = loadNavigationState();
      const selectedGroupId = savedState?.selectedGroupId || user.id.toString();

      setChatId(selectedGroupId);
    }
  }, [user?.id, chat_id]);

  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ["groupsWithExpenses", user?.id],
    queryFn: () => fetchGroups(user!.id.toString(), initData!),
    enabled: !!(user?.id && initData && isReady),
    staleTime: 10 * 60 * 1000, // 10 minutes - matches dashboard prefetch
  });

  // Update group name when groups change or chat_id changes
  useEffect(() => {
    if (chat_id && groupsData && groupsData.length > 0) {
      const currentGroup = groupsData.find((g: Group) => g.chat_id === chat_id);
      setGroupName(currentGroup?.name || currentGroup?.title || "Group");
    } else {
      setGroupName(null);
    }
  }, [chat_id, groupsData]);

  // Telegram UI setup and back button handler
  useEffect(() => {
    if (!isReady) return;

    // Initialize Telegram UI
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

    // Set up back button handler
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

    // Cleanup
    return () => {
      try {
        backButton.offClick(handleBack);
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [isReady, onViewChange, currentView]);

  // View handlers - MUST be before any early returns
  const handleViewChange = useCallback((view: SettingsView) => {
    setCurrentView(view);
  }, []);

  // View configurations - MUST be before any early returns
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
              onSelect={async (countryId) => {
                const success = await handleCountrySelect(countryId);
                if (success) setCurrentView("main");
              }}
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
              onSelect={async (currencyCode) => {
                const success = await handleCurrencySelect(currencyCode);
                if (success) setCurrentView("main");
              }}
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

      case "notifications":
        return {
          title: "Notifications",
          component: (
            <NotificationsSettings
              notificationsEnabled={preferencesData?.notification_enabled}
              dailyReminderHour={preferencesData?.daily_reminder_hour}
              onUpdateNotifications={async (enabled, hour) => {
                try {
                  const response = await fetch("/api/preferences", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      telegram_id: user?.id,
                      initData,
                      notification_enabled: enabled,
                      daily_reminder_hour: hour,
                      chat_id: chat_id !== user?.id?.toString() ? chat_id : undefined,
                    }),
                  });
                  
                  if (response.ok) {
                    console.log("🔄 Invalidating cache for:", ["preferences", user?.id, chat_id]);
                    // Invalidate queries to refresh data
                    await queryClient.invalidateQueries({
                      queryKey: ["preferences", user?.id, chat_id]
                    });
                    // Force refetch immediately
                    await queryClient.refetchQueries({
                      queryKey: ["preferences", user?.id, chat_id]
                    });
                    console.log("✅ Cache invalidated and refetched");
                  }
                } catch (error) {
                  console.error("Error updating notifications:", error);
                }
              }}
            />
          ),
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
    preferencesData,
    user,
    initData,
    queryClient,
  ]);

  // Render settings item - MUST be before any early returns
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

      if (item.key === "notifications") {
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
            value={(() => {
              console.log("📱 Settings page - notification_enabled:", preferencesData?.notification_enabled);
              return preferencesData?.notification_enabled ? "On" : "Off";
            })()}
            onClick={() => handleViewChange("notifications")}
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
    [control, filteredCountries, handleViewChange, isDark, currentTheme, preferencesData]
  );

  // Handle early returns AFTER all hooks
  // Handle Telegram initialization errors
  if (isReady && (!user || !initData)) {
    return (
      <AppLayout title="Settings">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
            textAlign: "center",
            py: 4,
          }}
        >
          <Typography variant="h6" sx={{ color: colors.error || "#ff4444" }}>
            Access Error
          </Typography>
          <Typography sx={{ color: colors.textSecondary, maxWidth: 300 }}>
            {error ||
              "Unable to access Telegram user data. Please make sure you're using this app through Telegram."}
          </Typography>
        </Box>
      </AppLayout>
    );
  }

  // Loading state
  if (preferencesLoading || groupsLoading) {
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
        headerExtra={
          currentView === "main" ? (
            <GroupSwitcherChip
              chat_id={chat_id}
              user={user}
              availableGroups={groupsData || []}
              groupName={groupName}
              setChatId={setChatId}
            />
          ) : null
        }
      >
        {viewConfig.component}
      </AppLayout>
    );
  }

  // Main settings view
  return (
    <AppLayout
      title="Settings"
      headerExtra={
        currentView === "main" ? (
          <GroupSwitcherChip
            chat_id={chat_id}
            user={user}
            availableGroups={groupsData || []}
            groupName={groupName}
            setChatId={setChatId}
          />
        ) : null
      }
    >
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
