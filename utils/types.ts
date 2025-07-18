export interface TelegramWebApp {
  initDataUnsafe?: {
    user?: {
      id: number;
    };
  };
  initData?: string;
  themeParams?: Record<string, string>;
  colorScheme?: string;
}

export interface Budget {
  id: number;
  amount: number;
  created_at: string;
  updated_at: string;
  category: {
    id: number;
    name: string;
  };
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  is_income: boolean;
  category?: {
    name: string;
    emoji?: string;
  };
}
