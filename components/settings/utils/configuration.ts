import { Country } from "countries-and-timezones";

export interface SettingsItemConfig {
  key: string;
  title: string;
  icon: string;
  iconBg: string;
  getValue?: (
    field: { value: string },
    filteredCountries?: Country[]
  ) => string;
}
// Configuration
export const SETTINGS_CONFIG = {
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
