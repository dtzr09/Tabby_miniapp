import { hapticFeedback } from "@telegram-apps/sdk";

/**
 * Haptic feedback utility for Telegram WebApp using @telegram-apps/sdk
 * Provides different types of haptic feedback for user interactions
 */

/**
 * Triggers haptic feedback for light interactions (button taps, toggles)
 */
export const lightHaptic = () => {
  try {
    if (hapticFeedback.isSupported()) {
      hapticFeedback.impactOccurred('light');
    }
  } catch (error) {
    // Silently handle errors in non-Telegram environments
  }
};

/**
 * Triggers haptic feedback for medium interactions (selections, mode changes)
 */
export const mediumHaptic = () => {
  try {
    if (hapticFeedback.isSupported()) {
      hapticFeedback.impactOccurred('medium');
    }
  } catch (error) {
    // Silently handle errors in non-Telegram environments
  }
};

/**
 * Triggers haptic feedback for heavy interactions (confirmations, major actions)
 */
export const heavyHaptic = () => {
  try {
    if (hapticFeedback.isSupported()) {
      hapticFeedback.impactOccurred('heavy');
    }
  } catch (error) {
    // Silently handle errors in non-Telegram environments
  }
};

/**
 * Triggers haptic feedback for selection changes (tabs, switches, scroll snapping)
 */
export const selectionHaptic = () => {
  try {
    if (hapticFeedback.isSupported()) {
      hapticFeedback.selectionChanged();
    }
  } catch (error) {
    // Silently handle errors in non-Telegram environments
  }
};

/**
 * Triggers haptic feedback for success notifications
 */
export const successHaptic = () => {
  try {
    if (hapticFeedback.isSupported()) {
      hapticFeedback.notificationOccurred('success');
    }
  } catch (error) {
    // Silently handle errors in non-Telegram environments
  }
};

/**
 * Triggers haptic feedback for error notifications
 */
export const errorHaptic = () => {
  try {
    if (hapticFeedback.isSupported()) {
      hapticFeedback.notificationOccurred('error');
    }
  } catch (error) {
    // Silently handle errors in non-Telegram environments
  }
};

/**
 * Triggers haptic feedback for warning notifications
 */
export const warningHaptic = () => {
  try {
    if (hapticFeedback.isSupported()) {
      hapticFeedback.notificationOccurred('warning');
    }
  } catch (error) {
    // Silently handle errors in non-Telegram environments
  }
};