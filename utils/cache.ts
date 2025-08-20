// Simple in-memory cache for performance optimization
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear all entries that match a pattern
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const appCache = new SimpleCache();

// Clean up expired cache items every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    appCache.cleanup();
  }, 5 * 60 * 1000);
}

// Cache invalidation utility functions
export const invalidateUserCache = (telegram_id: string, chat_id?: string | null) => {
  // Clear all entries related to this user
  appCache.clearPattern(`allEntries_${telegram_id}`);
  appCache.delete(`categories_${telegram_id}`);
  appCache.delete(`budgets_${telegram_id}`);
  appCache.delete(`user_${telegram_id}_${chat_id || 'personal'}`);
  console.log(`🗑️ Full user cache invalidated for ${telegram_id}`);
};

export const invalidateExpenseCache = (telegram_id: string, chat_id?: string | null) => {
  // Clear entries cache when expenses are modified
  appCache.clearPattern(`allEntries_${telegram_id}`);
  // Also clear budgets since budget progress depends on expenses
  appCache.delete(`budgets_${telegram_id}`);
  console.log(`🗑️ Expense cache invalidated for ${telegram_id}`);
};

export const invalidateBudgetCache = (telegram_id: string, chat_id?: string | null) => {
  // Clear budget-related caches
  appCache.delete(`budgets_${telegram_id}`);
  appCache.clearPattern(`allEntries_${telegram_id}`);
  console.log(`🗑️ Budget cache invalidated for ${telegram_id}`);
};