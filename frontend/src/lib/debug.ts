// Debug utility for frontend
let debugEnabled = false;

// Initialize debug mode from environment variable
if (typeof window !== 'undefined') {
  // In browser, check for environment variable (set by Next.js)
  debugEnabled = process.env.NEXT_PUBLIC_PTA_DEBUG_ENABLED === 'true';
} else {
  // In server-side context
  debugEnabled = process.env.PTA_DEBUG_ENABLED === 'true';
}

/**
 * Debug logging function that only logs when debug mode is enabled
 */
export const debugLog = (...args: any[]): void => {
  if (debugEnabled) {
    console.log('[DEBUG]', ...args);
  }
};

/**
 * Debug warning function that only logs when debug mode is enabled
 */
export const debugWarn = (...args: any[]): void => {
  if (debugEnabled) {
    console.warn('[DEBUG]', ...args);
  }
};

/**
 * Debug error function that only logs when debug mode is enabled
 */
export const debugError = (...args: any[]): void => {
  if (debugEnabled) {
    console.error('[DEBUG]', ...args);
  }
};

/**
 * Check if debug mode is currently enabled
 */
export const isDebugEnabled = (): boolean => {
  return debugEnabled;
};

/**
 * Set debug mode (useful for testing or runtime configuration)
 */
export const setDebugEnabled = (enabled: boolean): void => {
  debugEnabled = enabled;
}; 