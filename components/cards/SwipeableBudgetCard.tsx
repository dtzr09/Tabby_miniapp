import { useState, useRef, TouchEvent } from "react";
import BudgetOverviewCard from "./BudgetOverviewCard";
import { Box } from "@mui/material";

interface Budget {
  id: number;
  amount: number;
  created_at: string;
  updated_at: string;
  category: {
    id: number;
    name: string;
  };
}

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
  budgets?: Budget[];
}

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
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "pan-y" }}
    >
      <BudgetOverviewCard
        budgets={props.budgets}
        expenses={props.expenses}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </Box>
  );
}
