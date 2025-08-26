interface NavigationState {
  selectedGroupId: string | null;
  isGroupView: boolean;
}

const NAVIGATION_STATE_KEY = 'tabby_navigation_state';

export const saveNavigationState = (state: NavigationState): void => {
  try {
    localStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save navigation state:', error);
  }
};

export const loadNavigationState = (): NavigationState | null => {
  try {
    const saved = localStorage.getItem(NAVIGATION_STATE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load navigation state:', error);
  }
  return null;
};

export const clearNavigationState = (): void => {
  try {
    localStorage.removeItem(NAVIGATION_STATE_KEY);
  } catch (error) {
    console.warn('Failed to clear navigation state:', error);
  }
};