/**
 * Centralized timing constants for the application.
 *
 * All delays, timeouts, and intervals are defined here to avoid magic numbers
 * and make tuning easier from a single location.
 */

export const TIMING = {
  /** Interval for URL observer polling (ms) */
  URL_OBSERVER_INTERVAL: 500,

  /** Debounce delay for loading state checks (ms) */
  LOADING_DEBOUNCE: 300,

  /** Number of consecutive stable checks required to consider loading complete */
  LOADING_STABILITY_REQUIRED: 2,

  /** Maximum time to wait for loading to complete (ms) */
  LOADING_TIMEOUT: 15_000,

  /** Initial delay before refreshing supplier data (ms) */
  INITIAL_REFRESH_DELAY: 2_000,

  /** Timeout for each requestIdleCallback chunk (ms) */
  IDLE_CHUNK_TIMEOUT: 1_000,

  /** Timeout for requestIdleCallback refresh (ms) */
  IDLE_REFRESH_TIMEOUT: 2_000,
} as const;
