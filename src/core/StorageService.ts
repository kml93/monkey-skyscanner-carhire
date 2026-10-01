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
  type SupplierEntry,
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
  // ── Suppliers ───────────────────────────────────────────────────────────

  /** Retrieves the full map of supplier entries (ID → SupplierEntry). */
  static getSuppliers(): Map<string, SupplierEntry> {
    const raw = GM_getValue<Record<string, SupplierEntry>>(
      STORAGE_KEYS.SUPPLIERS,
      {},
    );

    return new Map(Object.entries(raw));
  }

  /** Persists the supplier entries map. */
  static setSuppliers(suppliers: Map<string, SupplierEntry>): void {
    const serializable = Object.fromEntries(suppliers);
    GM_setValue(STORAGE_KEYS.SUPPLIERS, serializable);
  }

  /**
   * Subscribes to supplier entry changes from OTHER tabs.
   * Automatically deserializes into a Map.
   */
  static onSuppliersChanged(
    callback: (suppliers: Map<string, SupplierEntry>, remote: boolean) => void,
  ): number {
    return this.subscribe<Record<string, SupplierEntry>>(
      STORAGE_KEYS.SUPPLIERS,
      (raw, remote) => {
        const map = new Map(Object.entries(raw ?? {}));
        callback(map, remote);
      },
    );
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

  /** Subscribes specifically to auto-config changes. */
  static onAutoConfigChanged(callback: ChangeCallback<AutoConfig>): number {
    return this.subscribe<AutoConfig>(STORAGE_KEYS.AUTO_CONFIG, callback);
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
}
