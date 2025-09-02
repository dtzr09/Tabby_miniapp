interface NavigationState {
  selectedGroupId: string | null;
  isGroupView: boolean;
  currentView?: "dashboard" | "settings";
  timestamp?: number;
}

const NAVIGATION_STATE_KEY = "tabby_navigation_state";
// Expiration time: 5 minutes in milliseconds
const NAVIGATION_STATE_EXPIRY = 5 * 60 * 1000;

export const saveNavigationState = (state: NavigationState): void => {
  try {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(
      NAVIGATION_STATE_KEY,
      JSON.stringify(stateWithTimestamp)
    );
  } catch (error) {
    console.warn("Failed to save navigation state:", error);
  }
};

export const loadNavigationState = (): NavigationState | null => {
  try {
    const saved = localStorage.getItem(NAVIGATION_STATE_KEY);
    if (saved) {
      const state = JSON.parse(saved);

      // Check if state has expired
      if (state.timestamp) {
        const currentTime = Date.now();
        const timeDiff = currentTime - state.timestamp;

        if (timeDiff > NAVIGATION_STATE_EXPIRY) {
          // State has expired, clear it and return null
          clearNavigationState();
          return null;
        }
      }

      return state;
    }
  } catch (error) {
    console.warn("Failed to load navigation state:", error);
  }
  return null;
};

export const clearNavigationState = (): void => {
  try {
    localStorage.removeItem(NAVIGATION_STATE_KEY);
  } catch (error) {
    console.warn("Failed to clear navigation state:", error);
  }
};

// Utility function to check if navigation state is expired without loading it
export const isNavigationStateExpired = (): boolean => {
  try {
    const saved = localStorage.getItem(NAVIGATION_STATE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      if (state.timestamp) {
        const currentTime = Date.now();
        const timeDiff = currentTime - state.timestamp;
        return timeDiff > NAVIGATION_STATE_EXPIRY;
      }
    }
  } catch (error) {
    console.warn("Failed to check navigation state expiration:", error);
  }
  return false;
};
