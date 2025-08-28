/**
 * Haptic feedback utility for Telegram WebApp
 * Uses the official Telegram Apps SDK for haptic feedback
 */

import { hapticFeedback } from "@telegram-apps/sdk";

/**
 * Triggers small haptic feedback for subtle interactions (scroll feedback)
 */
export const smallHaptic = () => {
  try {
    hapticFeedback.impactOccurred("light"); // Using light as the smallest available option
  } catch (error) {
    console.warn("Haptic feedback not available:", error);
  }
};

/**
 * Triggers haptic feedback for medium interactions (selections, mode changes)
 */
export const mediumHaptic = () => {
  try {
    hapticFeedback.impactOccurred("medium");
  } catch (error) {
    console.warn("Haptic feedback not available:", error);
  }
};
