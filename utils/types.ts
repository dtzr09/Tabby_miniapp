export interface TelegramWebApp {
  initDataUnsafe?: {
    user?: {
      id: string;
    };
    hash?: string;
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

export interface DBData {
  totalExpenses: number;
  dateRange: string;
  dailyExpenses: { day: string; amount: number }[];
  categories: {
    id: string;
    name: string;
    icon: React.JSX.Element;
    budget: number;
    spent: number;
    color: string;
  }[];
}

export interface PieChartData {
  name: string;
  value: number;
  fill: string;
}

export interface BarChartData {
  name: string;
  amount: number;
  lineValue: number;
  fill: string;
}

export type ViewMode = "daily" | "weekly" | "monthly";

export type ExpensesAndBudgets = {
  expenses: Expense[];
  budgets: Budget[];
};
