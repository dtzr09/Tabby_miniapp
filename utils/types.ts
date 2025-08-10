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
  lockOrientation?: (orientation: string) => void;
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

export interface Income {
  id: number;
  amount: number;
  description: string;
  date: string;
  category: Category;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  is_income: boolean;
  category: Category;
}

// New unified entry type for display components
export interface UnifiedEntry {
  id: number;
  description: string;
  category: string;
  emoji?: string;
  date: string;
  amount: number;
  isIncome: boolean;
}

// Service response types
export interface AllEntriesResponse {
  expenses: Expense[];
  income: Income[];
  budgets: Budget[];
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
  num_of_budgets: number;
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

export interface Category {
  id: number;
  name: string;
  emoji?: string;
  is_income: boolean;
}
