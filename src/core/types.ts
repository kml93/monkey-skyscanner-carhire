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
  /** Minimum price label (e.g. "à partir de 147 €"), raw text. */
  readonly priceLabel: string;
  /** Whether the native checkbox is currently checked. */
  checked: boolean;
}

/** Persisted user preference for a single supplier. */
export interface SupplierPreference {
  /** Skyscanner internal numeric ID. */
  readonly id: string;
  /** Display name snapshot at the time of saving. */
  readonly name: string;
  /** Whether this supplier is excluded from results. */
  excluded: boolean;
}

// ---------------------------------------------------------------------------
// Auto-Configuration
// ---------------------------------------------------------------------------

/** Toggleable auto-configuration options persisted across sessions. */
export interface AutoConfig {
  /** Force sort to "Le moins cher" on page load. */
  sortCheapest: boolean;
  /** Collapse all accordion sections except "Prestataire" on page load. */
  foldAccordions: boolean;
  /** Click "Afficher tous les fournisseurs" on page load. */
  expandAllSuppliers: boolean;
  /** Intercept programmatic scroll globally. */
  scrollLock: boolean;
  /** Apply supplier exclusions automatically on page load. */
  autoApply: boolean;
}

/** Default auto-config values — everything enabled for best UX. */
export const DEFAULT_AUTO_CONFIG: AutoConfig = {
  sortCheapest: true,
  foldAccordions: true,
  expandAllSuppliers: true,
  scrollLock: true,
  autoApply: true,
};

// ---------------------------------------------------------------------------
// Storage Keys
// ---------------------------------------------------------------------------

/** Centralized storage key constants to avoid magic strings. */
export const STORAGE_KEYS = {
  /** Map of supplier ID → SupplierPreference. */
  EXCLUDED_SUPPLIERS: 'skyscanner_excluded_suppliers',
  /** AutoConfig object. */
  AUTO_CONFIG: 'skyscanner_auto_config',
  /** Theme preference: 'light' | 'dark'. */
  THEME: 'skyscanner_theme',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ---------------------------------------------------------------------------
// Filter Strategy (SoC — prepared for future inverse mode)
// ---------------------------------------------------------------------------

/**
 * Strategy interface for supplier filtering.
 *
 * Current implementation: ExclusionStrategy (all included, exclude specific).
 * Future implementation: InclusionStrategy (all excluded, include specific).
 *
 * Follows the Strategy Pattern to allow swapping filter behavior
 * without modifying the FilterEngine.
 */
export interface FilterStrategy {
  /** Human-readable name for UI display. */
  readonly label: string;

  /**
   * Given the full list of supplier IDs and user preferences,
   * returns the IDs that should be UNCHECKED in the DOM.
   */
  computeUncheckedIds(
    allSupplierIds: string[],
    preferences: Map<string, SupplierPreference>,
  ): string[];
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Events emitted by the core engine for React hooks to subscribe to. */
export type DashboardEvent =
  | { type: 'suppliers-updated'; suppliers: Supplier[] }
  | { type: 'boot-complete' }
  | { type: 'filters-applied' }
  | { type: 'config-changed'; config: AutoConfig };
