/**
 * Supplier Registry — single source of truth for all supplier data.
 *
 * Combines the previous SupplierPreference and SupplierInfo into one unified
 * SupplierEntry store. Each entry contains:
 * - id, name, minPrice (captured from API responses)
 * - status (user's inclusion/exclusion preference)
 *
 * Data flow:
 *   API Response → captureFromResponse() → in-memory Map → GM_setValue()
 *   ApiInterceptor → getIncludedIds() → builds filters=suppliers:...
 *   Dashboard → getAll() → displays and edits suppliers
 *   FilterEngine → getIncludedIds() → applies DOM exclusions
 *
 * Single Responsibility: captures, stores, and serves supplier data with status.
 */

import { Logger } from './Logger';
import { StorageService } from './StorageService';
import type { SupplierEntry, SupplierStatus } from './types';

// ---------------------------------------------------------------------------
// Supplier Registry
// ---------------------------------------------------------------------------

export class SupplierRegistry {
  private static suppliers: Map<string, SupplierEntry> = new Map();
  private static loaded = false;
  private static listeners = new Set<() => void>();

  // ── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Loads persisted suppliers from Tampermonkey storage.
   * Must be called once at boot, before ApiInterceptor.install().
   */
  static initialize(): void {
    this.suppliers = StorageService.getSuppliers();
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
   * Preserves existing status when updating an entry.
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
      // Preserve status when updating
      const status = existing?.status ?? 'included';

      if (!existing || existing.name !== name || existing.minPrice !== minPrice) {
        this.suppliers.set(id, { id, name, minPrice, status });
        updated = true;
      }
    }

    if (updated) {
      StorageService.setSuppliers(this.suppliers);
      Logger.info(`SupplierRegistry: updated → ${this.suppliers.size} supplier(s).`);
      for (const listener of this.listeners) listener();
    }
  }

  // ── Queries ─────────────────────────────────────────────────────────────

  /** All known supplier IDs. */
  static getIds(): string[] {
    return Array.from(this.suppliers.keys());
  }

  /** Full supplier data (defensive copy). */
  static getAll(): Map<string, SupplierEntry> {
    return new Map(this.suppliers);
  }

  /** IDs of suppliers with status 'included'. */
  static getIncludedIds(): string[] {
    const included: string[] = [];
    for (const [id, entry] of this.suppliers) {
      if (entry.status === 'included') {
        included.push(id);
      }
    }
    return included;
  }

  /** IDs of suppliers with status 'excluded'. */
  static getExcludedIds(): string[] {
    const excluded: string[] = [];
    for (const [id, entry] of this.suppliers) {
      if (entry.status === 'excluded') {
        excluded.push(id);
      }
    }
    return excluded;
  }

  /** Count of excluded suppliers. */
  static getExcludedCount(): number {
    let count = 0;
    for (const entry of this.suppliers.values()) {
      if (entry.status === 'excluded') count++;
    }
    return count;
  }

  /** Supplier count. */
  static get size(): number {
    return this.suppliers.size;
  }

  /** Whether the registry has been initialized. */
  static isReady(): boolean {
    return this.loaded;
  }

  // ── Mutations ───────────────────────────────────────────────────────────

  /** Toggles a single supplier's status. */
  static toggleStatus(id: string): void {
    const entry = this.suppliers.get(id);
    if (!entry) return;

    const newStatus: SupplierStatus = entry.status === 'included' ? 'excluded' : 'included';
    this.suppliers.set(id, { ...entry, status: newStatus });
    StorageService.setSuppliers(this.suppliers);

    for (const listener of this.listeners) listener();
  }

  /** Sets status for multiple suppliers at once. */
  static setStatus(ids: string[], status: SupplierStatus): void {
    let updated = false;

    for (const id of ids) {
      const entry = this.suppliers.get(id);
      if (entry && entry.status !== status) {
        this.suppliers.set(id, { ...entry, status });
        updated = true;
      }
    }

    if (updated) {
      StorageService.setSuppliers(this.suppliers);
      for (const listener of this.listeners) listener();
    }
  }

  /** Sets status for all suppliers. */
  static setAllStatus(status: SupplierStatus): void {
    let updated = false;

    for (const [id, entry] of this.suppliers) {
      if (entry.status !== status) {
        this.suppliers.set(id, { ...entry, status });
        updated = true;
      }
    }

    if (updated) {
      StorageService.setSuppliers(this.suppliers);
      for (const listener of this.listeners) listener();
    }
  }

  /** Atomic commit from Dashboard (batch update). */
  static commit(updates: Map<string, SupplierEntry>): void {
    this.suppliers = new Map(updates);
    StorageService.setSuppliers(this.suppliers);
    Logger.info(`SupplierRegistry: committed ${this.suppliers.size} supplier(s).`);
    for (const listener of this.listeners) listener();
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
