import { useState, useRef, TouchEvent } from "react";
import BudgetOverviewCard from "./BudgetOverviewCard";

interface Expense {
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

interface SwipeableBudgetCardProps {
  onCategoryAction?: (categoryId: string) => void;
  expenses?: Expense[];
  budgets?: any[];
}

// Mock budgets
const mockBudgets = [
  {
    id: 1,
    amount: 500,
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2024-07-10T00:00:00Z",
    category: {
      id: 1,
      name: "🍕 Food & Dining",
    },
  },
  {
    id: 2,
    amount: 300,
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2024-07-10T00:00:00Z",
    category: {
      id: 2,
      name: "🚗 Transportation",
    },
  },
  {
    id: 3,
    amount: 200,
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2024-07-10T00:00:00Z",
    category: {
      id: 3,
      name: "🛍️ Shopping",
    },
  },
  {
    id: 4,
    amount: 150,
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2024-07-10T00:00:00Z",
    category: {
      id: 4,
      name: "🎬 Entertainment",
    },
  },
  {
    id: 5,
    amount: 100,
    created_at: "2024-07-01T00:00:00Z",
    updated_at: "2024-07-10T00:00:00Z",
    category: {
      id: 5,
      name: "⚡ Utilities",
    },
  },
];

// Mock expenses
const today = new Date().toISOString();
const mockExpenses = [
  {
    id: 1,
    amount: 45.5,
    description: "Pizza night",
    date: today,
    is_income: false,
    category: { name: "🍕 Food & Dining", emoji: "🍕" },
  },
  {
    id: 2,
    amount: 20.0,
    description: "Bus pass",
    date: today,
    is_income: false,
    category: { name: "🚗 Transportation", emoji: "🚗" },
  },
  {
    id: 3,
    amount: 60.0,
    description: "New shoes",
    date: today,
    is_income: false,
    category: { name: "🛍️ Shopping", emoji: "🛍️" },
  },
  {
    id: 4,
    amount: 30.0,
    description: "Movie tickets",
    date: today,
    is_income: false,
    category: { name: "🎬 Entertainment", emoji: "🎬" },
  },
  {
    id: 5,
    amount: 50.0,
    description: "Electric bill",
    date: today,
    is_income: false,
    category: { name: "⚡ Utilities", emoji: "⚡" },
  },
  {
    id: 6,
    amount: 100.0,
    description: "Salary",
    date: today,
    is_income: true,
    category: { name: "💼 Income", emoji: "💼" },
  },
];

export default function SwipeableBudgetCard(props: SwipeableBudgetCardProps) {
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">(
    "weekly"
  );
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left - go to next view mode
      if (viewMode === "daily") setViewMode("weekly");
      else if (viewMode === "weekly") setViewMode("monthly");
    } else if (isRightSwipe) {
      // Swipe right - go to previous view mode
      if (viewMode === "monthly") setViewMode("weekly");
      else if (viewMode === "weekly") setViewMode("daily");
    }

    // Reset touch coordinates
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "pan-y" }}
    >
      <BudgetOverviewCard
        // {...props}
        budgets={mockBudgets}
        expenses={mockExpenses}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
}
