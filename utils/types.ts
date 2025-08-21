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
  chat_id?: string;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  is_income: boolean;
  category: Category;
  shares?: Array<ExpenseShare>;
  chat_id?: string;
}

export interface ExpenseShare {
  user_id: string | number;
  share_amount: number;
  user_name?: string;
  username?: string;
  name?: string; // For backward compatibility
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
  isPersonalShare?: boolean;
  originalAmount?: number;
  userShare?: {
    user_id: string | number;
    share_amount: number;
  };
  chat_id?: string;
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
  id: number | string;
  name: string;
  emoji?: string;
  is_income: boolean;
}

export interface User {
  id: number;
  telegram_id: string;
  chat_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFormData {
  description: string;
  amount: string;
  category_id: string | number;
}

// New types to replace 'any' usage

export interface Group {
  id?: string;
  chat_id: string;
  name?: string;
  title?: string;
  telegram_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GroupWithExpenses extends Group {
  expenses?: Expense[];
}

export interface BudgetWithCategory {
  id: number;
  amount: number;
  category_id: number;
  created_at: string;
  updated_at: string;
}

export interface ChartDataPoint {
  name: string;
  amount: number;
  value?: number;
  fill?: string;
  [key: string]: string | number | undefined;
}

export interface QueryData {
  expenses?: Expense[];
  income?: Income[];
  budgets?: Budget[];
  [key: string]: unknown;
}

export interface ExpenseShareWithUser extends ExpenseShare {
  user?: {
    name?: string;
    username?: string;
  };
}
