// Types
export interface UserPreferences {
  currency: string;
  timezone: string;
  country: string;
}

export type SettingsView =
  | "main"
  | "country"
  | "currency"
  | "categories"
  | "theme";

export interface ViewConfig {
  title: string;
  component: React.ReactNode;
}
