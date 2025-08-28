import { QueryClient } from '@tanstack/react-query';

interface ExpenseUpdateEvent {
  type: 'EXPENSE_UPDATED' | 'EXPENSE_DELETED' | 'EXPENSE_CREATED';
  userId: string;
  chatId?: string;
  expenseId?: string;
  timestamp: number;
}

class ExpenseUpdateBroadcaster {
  private static instance: ExpenseUpdateBroadcaster;
  private queryClient: QueryClient | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<(event: ExpenseUpdateEvent) => void> = new Set();
  private pollingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initBroadcastChannel();
    this.initStorageListener();
  }

  public static getInstance(): ExpenseUpdateBroadcaster {
    if (!ExpenseUpdateBroadcaster.instance) {
      ExpenseUpdateBroadcaster.instance = new ExpenseUpdateBroadcaster();
    }
    return ExpenseUpdateBroadcaster.instance;
  }

  public setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('expense-updates');
        this.broadcastChannel.addEventListener('message', (event) => {
          this.handleBroadcastMessage(event.data);
        });
      } catch (error) {
        console.warn('BroadcastChannel not available:', error);
      }
    }
  }

  private initStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'expense-update-signal') {
          try {
            const updateEvent = JSON.parse(event.newValue || '{}');
            this.handleUpdateEvent(updateEvent);
          } catch (error) {
            console.warn('Failed to parse storage event:', error);
          }
        }
      });
    }
  }

  private handleBroadcastMessage(data: ExpenseUpdateEvent) {
    this.handleUpdateEvent(data);
  }

  private async handleUpdateEvent(event: ExpenseUpdateEvent) {
    // Notify listeners
    this.listeners.forEach(listener => listener(event));

    // Aggressive cache invalidation
    if (this.queryClient) {
      try {
        // Method 1: Specific query invalidation
        await this.queryClient.invalidateQueries({
          queryKey: ['allEntries', event.userId, event.chatId],
          refetchType: 'active'
        });

        // Method 2: Broad pattern matching
        await this.queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return (
              key.includes('allEntries') || 
              key.includes('groupsWithExpenses') || 
              key.includes('categories')
            ) && key.includes(event.userId);
          }
        });

        // Method 3: Force immediate refetch
        await this.queryClient.refetchQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return (
              key.includes('allEntries') || 
              key.includes('groupsWithExpenses')
            ) && key.includes(event.userId);
          },
          type: 'active'
        });

        console.log('🔄 Cache invalidated successfully for event:', event.type);
      } catch (error) {
        console.error('❌ Cache invalidation failed:', error);
        
        // Fallback: Clear all cache
        this.queryClient.clear();
        console.log('🧹 Cleared all cache as fallback');
      }
    }
  }

  public broadcastUpdate(event: ExpenseUpdateEvent) {
    // Method 1: BroadcastChannel (same tab group)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch (error) {
        console.warn('BroadcastChannel failed:', error);
      }
    }

    // Method 2: LocalStorage (cross-tab, persistent)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('expense-update-signal', JSON.stringify(event));
        // Clear it after a short delay to trigger storage events
        setTimeout(() => {
          localStorage.removeItem('expense-update-signal');
        }, 100);
      } catch (error) {
        console.warn('LocalStorage broadcast failed:', error);
      }
    }

    // Method 3: Direct handler call (current tab)
    this.handleUpdateEvent(event);
  }

  public addListener(listener: (event: ExpenseUpdateEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public startPolling(userId: string, chatId?: string, intervalMs: number = 10000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(() => {
      if (this.queryClient) {
        this.queryClient.invalidateQueries({
          queryKey: ['allEntries', userId, chatId],
          refetchType: 'active'
        });
      }
    }, intervalMs);
  }

  public stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  public cleanup() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    this.stopPolling();
    this.listeners.clear();
  }
}

// Export singleton instance
export const expenseUpdateBroadcaster = ExpenseUpdateBroadcaster.getInstance();

// Convenience functions
export const broadcastExpenseUpdate = (userId: string, chatId?: string, expenseId?: string) => {
  expenseUpdateBroadcaster.broadcastUpdate({
    type: 'EXPENSE_UPDATED',
    userId,
    chatId,
    expenseId,
    timestamp: Date.now()
  });
};

export const broadcastExpenseDelete = (userId: string, chatId?: string, expenseId?: string) => {
  expenseUpdateBroadcaster.broadcastUpdate({
    type: 'EXPENSE_DELETED',
    userId,
    chatId,
    expenseId,
    timestamp: Date.now()
  });
};

export const broadcastExpenseCreate = (userId: string, chatId?: string, expenseId?: string) => {
  expenseUpdateBroadcaster.broadcastUpdate({
    type: 'EXPENSE_CREATED',
    userId,
    chatId,
    expenseId,
    timestamp: Date.now()
  });
};