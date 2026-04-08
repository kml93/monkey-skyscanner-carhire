/**
 * Persistent storage service backed by Tampermonkey GM_* APIs.
 *
 * Provides typed access to all persisted preferences and supports
 * cross-tab synchronization via GM_addValueChangeListener.
 *
 * Single Responsibility: only handles data serialization and persistence.
 */

import {
  type AutoConfig,
  DEFAULT_AUTO_CONFIG,
  STORAGE_KEYS,
  type SupplierPreference,
} from './types';

// ---------------------------------------------------------------------------
// Tampermonkey API Type Declarations
// ---------------------------------------------------------------------------

declare function GM_getValue<T>(key: string, defaultValue: T): T;
declare function GM_setValue(key: string, value: unknown): void;
declare function GM_addValueChangeListener(
  key: string,
  callback: (key: string, oldValue: unknown, newValue: unknown, remote: boolean) => void,
): number;
declare function GM_removeValueChangeListener(listenerId: number): void;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChangeCallback<T> = (newValue: T, remote: boolean) => void;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class StorageService {
  // ── Supplier Preferences ───────────────────────────────────────────────

  /** Retrieves the full map of supplier preferences (ID → preference). */
  static getExcludedSuppliers(): Map<string, SupplierPreference> {
    const raw = GM_getValue<Record<string, SupplierPreference>>(
      STORAGE_KEYS.EXCLUDED_SUPPLIERS,
      {},
    );

    return new Map(Object.entries(raw));
  }

  /** Persists the supplier preferences map. */
  static setExcludedSuppliers(preferences: Map<string, SupplierPreference>): void {
    const serializable = Object.fromEntries(preferences);
    GM_setValue(STORAGE_KEYS.EXCLUDED_SUPPLIERS, serializable);
  }

  /** Convenience: check if a specific supplier is excluded. */
  static isSupplierExcluded(supplierId: string): boolean {
    const prefs = this.getExcludedSuppliers();
    return prefs.get(supplierId)?.excluded ?? false;
  }

  // ── Auto-Configuration ─────────────────────────────────────────────────

  /** Retrieves auto-config preferences with defaults. */
  static getAutoConfig(): AutoConfig {
    return GM_getValue<AutoConfig>(STORAGE_KEYS.AUTO_CONFIG, DEFAULT_AUTO_CONFIG);
  }

  /** Persists auto-config preferences. */
  static setAutoConfig(config: AutoConfig): void {
    GM_setValue(STORAGE_KEYS.AUTO_CONFIG, config);
  }

  // ── Theme ──────────────────────────────────────────────────────────────

  /** Retrieves theme preference. */
  static getTheme(): 'light' | 'dark' {
    return GM_getValue<'light' | 'dark'>(STORAGE_KEYS.THEME, 'dark');
  }

  /** Persists theme preference. */
  static setTheme(theme: 'light' | 'dark'): void {
    GM_setValue(STORAGE_KEYS.THEME, theme);
  }

  // ── Cross-Tab Synchronization ──────────────────────────────────────────

  /**
   * Subscribes to changes on a storage key from OTHER tabs.
   * Returns a listener ID that can be passed to `unsubscribe()`.
   */
  static subscribe<T>(key: string, callback: ChangeCallback<T>): number {
    return GM_addValueChangeListener(
      key,
      (_key, _oldValue, newValue, remote) => {
        callback(newValue as T, remote);
      },
    );
  }

  /** Unsubscribes a previously registered listener. */
  static unsubscribe(listenerId: number): void {
    GM_removeValueChangeListener(listenerId);
  }

  /**
   * Subscribes specifically to supplier preference changes.
   * Automatically deserializes into a Map.
   */
  static onSuppliersChanged(
    callback: (preferences: Map<string, SupplierPreference>, remote: boolean) => void,
  ): number {
    return this.subscribe<Record<string, SupplierPreference>>(
      STORAGE_KEYS.EXCLUDED_SUPPLIERS,
      (raw, remote) => {
        const map = new Map(Object.entries(raw ?? {}));
        callback(map, remote);
      },
    );
  }

  /** Subscribes specifically to auto-config changes. */
  static onAutoConfigChanged(callback: ChangeCallback<AutoConfig>): number {
    return this.subscribe<AutoConfig>(STORAGE_KEYS.AUTO_CONFIG, callback);
  }
}
