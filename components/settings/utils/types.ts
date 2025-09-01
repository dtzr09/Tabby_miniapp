// Types
export interface UserPreferences {
  currency: string;
  timezone: string;
  country: string;
  notification_enabled?: boolean;
  daily_reminder_hour?: number;
}

export type SettingsView =
  | "main"
  | "country"
  | "currency"
  | "categories"
  | "theme"
  | "notifications";

export interface ViewConfig {
  title: string;
  component: React.ReactNode;
}
