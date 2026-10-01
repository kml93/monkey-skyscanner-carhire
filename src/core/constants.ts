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

/**
 * Constants for Skyscanner's carhire-quotes API contracts.
 */
export const API_CONSTANTS = {
  /** URL substring identifying carhire-quotes API requests */
  QUOTES_PATH: '/g/carhire-quotes/',
  /** Query parameter prefix for supplier filters */
  SUPPLIERS_FILTER_PREFIX: 'suppliers:',
  /** Segment separator for the `filters` parameter (`price:…|suppliers:…`) */
  FILTERS_SEPARATOR: '|',
  /**
   * Query value for `sort_type`. The API only accepts
   * `cheapest | -cheapest | recommended | -recommended | distance`.
   */
  SORT_TYPE_CHEAPEST: 'cheapest',
} as const;
