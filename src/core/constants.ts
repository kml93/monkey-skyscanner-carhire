/**
 * Centralized timing constants for the application.
 *
 * All delays, timeouts, and intervals are defined here to avoid magic numbers
 * and make tuning easier from a single location.
 */

export const TIMING = {
  /** Timeout for requestIdleCallback refresh (ms) */
  IDLE_REFRESH_TIMEOUT: 2_000,
} as const;
