/**
 * Supplier Registry — captures and persists supplier data from API responses.
 *
 * Single source of truth for all known suppliers, independent of DOM state.
 * Captures id, name, and minPrice from the `filters` field of carhire-quotes
 * API responses.
 *
 * Data flow:
 *   API Response → captureFromResponse() → in-memory Map → GM_setValue()
 *   ApiInterceptor → getIds() → builds filters=suppliers:...
 *   useSkyscannerState → getAll() → populates Dashboard
 *
 * Single Responsibility: only captures, stores, and serves supplier data.
 */

import { Logger } from './Logger';
import { StorageService } from './StorageService';
import type { SupplierInfo } from './types';

// ---------------------------------------------------------------------------
// Supplier Registry
// ---------------------------------------------------------------------------

export class SupplierRegistry {
  private static suppliers: Map<string, SupplierInfo> = new Map();
  private static loaded = false;
  private static listeners = new Set<() => void>();

  // ── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Loads persisted registry from Tampermonkey storage.
   * Must be called once at boot, before ApiInterceptor.install().
   */
  static initialize(): void {
    this.suppliers = StorageService.getSupplierRegistry();
    this.loaded = true;
    Logger.info(`SupplierRegistry: loaded ${this.suppliers.size} supplier(s) from storage.`);
  }

  // ── Data Capture ────────────────────────────────────────────────────────

  /**
   * Captures supplier data from a carhire-quotes API response.
   *
   * Parses `filters → filter_type_suppliers → options[]` to extract:
   * - id (numeric string)
   * - display_text (name)
   * - price_range.min (minimum price)
   *
   * Accumulates across sessions — new suppliers are added, existing updated.
   */
  static captureFromResponse(data: Record<string, unknown>): void {
    const filters = data?.filters;
    if (!Array.isArray(filters)) return;

    const supplierFilter = filters.find(
      (f: Record<string, unknown>) => f.filter_type === 'filter_type_suppliers',
    );
    if (!supplierFilter) return;

    const options = (supplierFilter as Record<string, unknown>)?.string_value_filter &&
      ((supplierFilter as Record<string, Record<string, unknown>>).string_value_filter as Record<string, unknown>)?.options;
    if (!Array.isArray(options)) return;

    let updated = false;

    for (const opt of options as Array<Record<string, unknown>>) {
      const id = String(opt.id);
      const name = String(opt.display_text ?? '');
      const minPrice = (opt.price_range as Record<string, unknown> | undefined)?.min != null
        ? Number((opt.price_range as Record<string, unknown>).min)
        : null;

      const existing = this.suppliers.get(id);
      if (!existing || existing.name !== name || existing.minPrice !== minPrice) {
        this.suppliers.set(id, { id, name, minPrice });
        updated = true;
      }
    }

    if (updated) {
      StorageService.setSupplierRegistry(this.suppliers);
      Logger.info(`SupplierRegistry: updated → ${this.suppliers.size} supplier(s).`);
      for (const listener of this.listeners) listener();
    }
  }

  // ── Queries ─────────────────────────────────────────────────────────────

  /** All known supplier IDs. */
  static getIds(): string[] {
    return Array.from(this.suppliers.keys());
  }

  /** Full registry data (defensive copy). */
  static getAll(): Map<string, SupplierInfo> {
    return new Map(this.suppliers);
  }

  /** Supplier count. */
  static get size(): number {
    return this.suppliers.size;
  }

  /** Whether the registry has been initialized. */
  static isReady(): boolean {
    return this.loaded;
  }

  // ── Reactivity ──────────────────────────────────────────────────────────

  /**
   * Subscribes to registry data changes.
   * Returns an unsubscribe function.
   */
  static onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
}
