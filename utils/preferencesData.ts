export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}

export interface Timezone {
  value: string;
  label: string;
  offset: string;
}

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "🇲🇽" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "PLN", name: "Polish Złoty", symbol: "zł", flag: "🇵🇱" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", flag: "🇬🇭" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", flag: "🇺🇦" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺" },
  { code: "RON", name: "Romanian Leu", symbol: "lei", flag: "🇷🇴" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв", flag: "🇧🇬" },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn", flag: "🇭🇷" },
  { code: "RSD", name: "Serbian Dinar", symbol: "дин", flag: "🇷🇸" },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$U", flag: "🇺🇾" },
  { code: "CLP", name: "Chilean Peso", symbol: "$", flag: "🇨🇱" },
  { code: "COP", name: "Colombian Peso", symbol: "$", flag: "🇨🇴" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/", flag: "🇵🇪" },
  { code: "ARS", name: "Argentine Peso", symbol: "$", flag: "🇦🇷" },
];

export const timezones: Timezone[] = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: "UTC+0" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)", offset: "UTC-5" },
  { value: "America/Chicago", label: "Central Time (US & Canada)", offset: "UTC-6" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)", offset: "UTC-7" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)", offset: "UTC-8" },
  { value: "America/Anchorage", label: "Alaska Time", offset: "UTC-9" },
  { value: "Pacific/Honolulu", label: "Hawaii Time", offset: "UTC-10" },
  { value: "Europe/London", label: "London", offset: "UTC+0" },
  { value: "Europe/Paris", label: "Paris", offset: "UTC+1" },
  { value: "Europe/Berlin", label: "Berlin", offset: "UTC+1" },
  { value: "Europe/Rome", label: "Rome", offset: "UTC+1" },
  { value: "Europe/Madrid", label: "Madrid", offset: "UTC+1" },
  { value: "Europe/Amsterdam", label: "Amsterdam", offset: "UTC+1" },
  { value: "Europe/Brussels", label: "Brussels", offset: "UTC+1" },
  { value: "Europe/Vienna", label: "Vienna", offset: "UTC+1" },
  { value: "Europe/Zurich", label: "Zurich", offset: "UTC+1" },
  { value: "Europe/Stockholm", label: "Stockholm", offset: "UTC+1" },
  { value: "Europe/Oslo", label: "Oslo", offset: "UTC+1" },
  { value: "Europe/Copenhagen", label: "Copenhagen", offset: "UTC+1" },
  { value: "Europe/Helsinki", label: "Helsinki", offset: "UTC+2" },
  { value: "Europe/Athens", label: "Athens", offset: "UTC+2" },
  { value: "Europe/Prague", label: "Prague", offset: "UTC+1" },
  { value: "Europe/Budapest", label: "Budapest", offset: "UTC+1" },
  { value: "Europe/Warsaw", label: "Warsaw", offset: "UTC+1" },
  { value: "Europe/Bucharest", label: "Bucharest", offset: "UTC+2" },
  { value: "Europe/Sofia", label: "Sofia", offset: "UTC+2" },
  { value: "Europe/Kiev", label: "Kiev", offset: "UTC+2" },
  { value: "Europe/Moscow", label: "Moscow", offset: "UTC+3" },
  { value: "Asia/Tokyo", label: "Tokyo", offset: "UTC+9" },
  { value: "Asia/Shanghai", label: "Shanghai", offset: "UTC+8" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", offset: "UTC+8" },
  { value: "Asia/Singapore", label: "Singapore", offset: "UTC+8" },
  { value: "Asia/Seoul", label: "Seoul", offset: "UTC+9" },
  { value: "Asia/Bangkok", label: "Bangkok", offset: "UTC+7" },
  { value: "Asia/Jakarta", label: "Jakarta", offset: "UTC+7" },
  { value: "Asia/Manila", label: "Manila", offset: "UTC+8" },
  { value: "Asia/Kolkata", label: "Kolkata", offset: "UTC+5:30" },
  { value: "Asia/Dhaka", label: "Dhaka", offset: "UTC+6" },
  { value: "Asia/Karachi", label: "Karachi", offset: "UTC+5" },
  { value: "Asia/Dubai", label: "Dubai", offset: "UTC+4" },
  { value: "Asia/Riyadh", label: "Riyadh", offset: "UTC+3" },
  { value: "Asia/Tehran", label: "Tehran", offset: "UTC+3:30" },
  { value: "Asia/Jerusalem", label: "Jerusalem", offset: "UTC+2" },
  { value: "Africa/Cairo", label: "Cairo", offset: "UTC+2" },
  { value: "Africa/Lagos", label: "Lagos", offset: "UTC+1" },
  { value: "Africa/Johannesburg", label: "Johannesburg", offset: "UTC+2" },
  { value: "Africa/Nairobi", label: "Nairobi", offset: "UTC+3" },
  { value: "Australia/Sydney", label: "Sydney", offset: "UTC+10" },
  { value: "Australia/Melbourne", label: "Melbourne", offset: "UTC+10" },
  { value: "Australia/Perth", label: "Perth", offset: "UTC+8" },
  { value: "Pacific/Auckland", label: "Auckland", offset: "UTC+12" },
  { value: "America/Toronto", label: "Toronto", offset: "UTC-5" },
  { value: "America/Vancouver", label: "Vancouver", offset: "UTC-8" },
  { value: "America/Mexico_City", label: "Mexico City", offset: "UTC-6" },
  { value: "America/Sao_Paulo", label: "São Paulo", offset: "UTC-3" },
  { value: "America/Buenos_Aires", label: "Buenos Aires", offset: "UTC-3" },
  { value: "America/Santiago", label: "Santiago", offset: "UTC-3" },
  { value: "America/Lima", label: "Lima", offset: "UTC-5" },
  { value: "America/Bogota", label: "Bogota", offset: "UTC-5" },
  { value: "America/Caracas", label: "Caracas", offset: "UTC-4" },
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return currencies.find(currency => currency.code === code);
};

export const getTimezoneByValue = (value: string): Timezone | undefined => {
  return timezones.find(timezone => timezone.value === value);
}; 