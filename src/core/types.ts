/**
 * Shared types and interfaces for the Skyscanner Dashboard.
 *
 * All domain models, configuration shapes, and strategy contracts
 * are defined here to enforce a single source of truth.
 */

// ---------------------------------------------------------------------------
// Domain Models
// ---------------------------------------------------------------------------

/** Represents a car rental supplier as scraped from the Skyscanner DOM. */
export interface Supplier {
  /** Skyscanner internal numeric ID (e.g. "2091") — primary key. */
  readonly id: string;
  /** Display name (e.g. "Eren Rent a Car"). */
  readonly name: string;
  /** Minimum price label (e.g. "from 147 €"), raw text. */
  readonly priceLabel: string;
  /** Numerical price extracted from priceLabel for sorting. */
  readonly price: number;
  /** Whether the native checkbox is currently checked. */
  checked: boolean;
}

/** Available sorting options for the suppliers list. */
export type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

/** Supplier inclusion/exclusion status. */
export type SupplierStatus = 'included' | 'excluded';

/** Single source of truth for a supplier. */
export interface SupplierEntry {
  /** Skyscanner internal numeric ID. */
  readonly id: string;
  /** Display name (e.g. "Eren Rent a Car"). */
  readonly name: string;
  /** Minimum price from price_range.min, null if unavailable. */
  readonly minPrice: number | null;
  /** Current inclusion/exclusion status. */
  status: SupplierStatus;
}

// ---------------------------------------------------------------------------
// Auto-Configuration
// ---------------------------------------------------------------------------

/** Toggleable auto-configuration options persisted across sessions. */
export interface AutoConfig {
  /** Intercept programmatic scroll globally. */
  scrollLock: boolean;
  /**
   * Use API interception (Approach D) for filtering on SPA navigations.
   * When enabled, patches window.fetch to modify carhire-quotes responses
   * before React processes them — zero DOM interaction, zero anti-bot risk.
   *
   * Hybrid: DOM-based filtering still handles the initial page load;
   * API interception handles subsequent SPA navigations.
   */
  apiFilter: boolean;
}

/** Default auto-config values — everything enabled for best UX. */
export const DEFAULT_AUTO_CONFIG: AutoConfig = {
  scrollLock: false,
  apiFilter: false,
};

// ---------------------------------------------------------------------------
// Storage Keys
// ---------------------------------------------------------------------------

/** Centralized storage key constants to avoid magic strings. */
export const STORAGE_KEYS = {
  /** Map of supplier ID → SupplierEntry. */
  SUPPLIERS: 'skyscanner_suppliers',
  /** AutoConfig object. */
  AUTO_CONFIG: 'skyscanner_auto_config',
  /** Theme preference: 'light' | 'dark'. */
  THEME: 'skyscanner_theme',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

