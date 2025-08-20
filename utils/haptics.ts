/**
 * Haptic feedback utility for Telegram WebApp
 * Provides different types of haptic feedback for user interactions
 */

// Telegram WebApp haptic feedback interface
interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        HapticFeedback?: TelegramHapticFeedback;
      };
    };
  }
}

/**
 * Triggers haptic feedback for light interactions (button taps, toggles)
 */
export const lightHaptic = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
};

/**
 * Triggers haptic feedback for medium interactions (selections, mode changes)
 */
export const mediumHaptic = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
};

/**
 * Triggers haptic feedback for heavy interactions (confirmations, major actions)
 */
export const heavyHaptic = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
};

/**
 * Triggers haptic feedback for selection changes (tabs, switches)
 */
export const selectionHaptic = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
};

/**
 * Triggers haptic feedback for success notifications
 */
export const successHaptic = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
};

/**
 * Triggers haptic feedback for error notifications
 */
export const errorHaptic = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
};

/**
 * Triggers haptic feedback for warning notifications
 */
export const warningHaptic = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }
};