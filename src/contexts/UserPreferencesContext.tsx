import React, { createContext, useContext, useEffect, useState } from "react";

interface UserPreferences {
  currency: string;
  timezone: string;
  country: string;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updateCurrency: (currency: string) => void;
  updateTimezone: (timezone: string) => void;
  updateCountry: (country: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  syncPreferencesWithBackend: (telegram_id: string, initData: string) => Promise<boolean>;
  loadPreferencesFromBackend: (telegram_id: string, initData: string) => Promise<boolean>;
}

const defaultPreferences: UserPreferences = {
  currency: "USD",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  country: "SG", // Default to Singapore
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
};

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem("userPreferences");
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error("Error parsing saved preferences:", error);
      }
    }
  }, []);

  const updateCurrency = (currency: string) => {
    console.log("updateCurrency called with:", currency);
    const newPreferences = { ...preferences, currency };
    console.log("New preferences:", newPreferences);
    setPreferences(newPreferences);
    if (mounted) {
      localStorage.setItem("userPreferences", JSON.stringify(newPreferences));
    }
  };

  const updateTimezone = (timezone: string) => {
    console.log("updateTimezone called with:", timezone);
    const newPreferences = { ...preferences, timezone };
    console.log("New preferences:", newPreferences);
    setPreferences(newPreferences);
    if (mounted) {
      localStorage.setItem("userPreferences", JSON.stringify(newPreferences));
    }
  };

  const updateCountry = (country: string) => {
    console.log("updateCountry called with:", country);
    const newPreferences = { ...preferences, country };
    console.log("New preferences:", newPreferences);
    setPreferences(newPreferences);
    if (mounted) {
      localStorage.setItem("userPreferences", JSON.stringify(newPreferences));
    }
  };

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    if (mounted) {
      localStorage.setItem("userPreferences", JSON.stringify(updated));
    }
  };

  const syncPreferencesWithBackend = async (telegram_id: string, initData: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegram_id,
          initData,
          currency: preferences.currency,
          timezone: preferences.timezone,
          country: preferences.country,
        }),
      });

      if (!response.ok) {
        console.error('Failed to sync preferences:', response.statusText);
        return false;
      }

      const data = await response.json();
      console.log('✅ Preferences synced with backend:', data);
      return true;
    } catch (error) {
      console.error('❌ Error syncing preferences:', error);
      return false;
    }
  };

  const loadPreferencesFromBackend = async (telegram_id: string, initData: string): Promise<boolean> => {
    try {
      const params = new URLSearchParams({
        telegram_id,
        initData,
      });

      const response = await fetch(`/api/preferences?${params.toString()}`);
      
      if (!response.ok) {
        console.error('Failed to load preferences:', response.statusText);
        return false;
      }

      const data = await response.json();
      
      // Update local preferences with backend data
      const newPreferences = { ...preferences };
      if (data.currency) newPreferences.currency = data.currency;
      if (data.timezone) newPreferences.timezone = data.timezone;
      if (data.country) newPreferences.country = data.country;
      
      setPreferences(newPreferences);
      if (mounted) {
        localStorage.setItem("userPreferences", JSON.stringify(newPreferences));
      }
      
      console.log('✅ Preferences loaded from backend:', data);
      return true;
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
      return false;
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        updateCurrency,
        updateTimezone,
        updateCountry,
        updatePreferences,
        syncPreferencesWithBackend,
        loadPreferencesFromBackend,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}; 