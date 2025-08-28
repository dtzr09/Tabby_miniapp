/**
 * Haptic feedback utility for Telegram WebApp
 * Uses the official Telegram Apps SDK for haptic feedback
 */

import { hapticFeedback } from '@telegram-apps/sdk';

/**
 * Triggers haptic feedback for light interactions (button taps, toggles)
 */
export const lightHaptic = () => {
  try {
    hapticFeedback.impactOccurred('light');
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Triggers small haptic feedback for subtle interactions (scroll feedback)
 */
export const smallHaptic = () => {
  try {
    hapticFeedback.impactOccurred('light'); // Using light as the smallest available option
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Triggers haptic feedback for medium interactions (selections, mode changes)
 */
export const mediumHaptic = () => {
  try {
    hapticFeedback.impactOccurred('medium');
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

// /**
//  * Triggers haptic feedback for heavy interactions (confirmations, major actions)
//  */
// export const heavyHaptic = () => {
//   if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
//     try {
//       window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
//     } catch (error) {
//       console.warn('Haptic feedback not available:', error);
//     }
//   }
// };

// /**
//  * Triggers haptic feedback for selection changes (tabs, switches)
//  */
// export const selectionHaptic = () => {
//   if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
//     try {
//       window.Telegram.WebApp.HapticFeedback.selectionChanged();
//     } catch (error) {
//       console.warn('Haptic feedback not available:', error);
//     }
//   }
// };

// /**
//  * Triggers haptic feedback for success notifications
//  */
// export const successHaptic = () => {
//   if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
//     try {
//       window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
//     } catch (error) {
//       console.warn('Haptic feedback not available:', error);
//     }
//   }
// };

// /**
//  * Triggers haptic feedback for error notifications
//  */
// export const errorHaptic = () => {
//   if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
//     try {
//       window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
//     } catch (error) {
//       console.warn('Haptic feedback not available:', error);
//     }
//   }
// };

// /**
//  * Triggers haptic feedback for warning notifications
//  */
// export const warningHaptic = () => {
//   if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
//     try {
//       window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
//     } catch (error) {
//       console.warn('Haptic feedback not available:', error);
//     }
//   }
// };
