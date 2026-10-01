/**
 * Supplier Registry — single source of truth for all supplier data.
 *
 * Combines the previous SupplierPreference and SupplierInfo into one unified
 * SupplierEntry store. Each entry contains:
 * - id, name, minPrice (captured from API responses)
 * - status (user's inclusion/exclusion preference)
 *
 * Data flow:
 *   API Response → captureFromResponse() → GM_setValue() (single source, no in-memory copy)
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
// Types
// ---------------------------------------------------------------------------

interface PriceRange {
  min: number | null;
}

interface SupplierOption {
  id: string | number;
  display_text: string;
  price_range?: PriceRange;
}

interface SupplierFilter {
  filter_type: string;
  string_value_filter?: {
    options?: SupplierOption[];
  };
}

interface SkyscannerApiResponse {
  filters?: SupplierFilter[];
}

// ---------------------------------------------------------------------------
// Supplier Registry
// ---------------------------------------------------------------------------

export class SupplierRegistry {
  private static listeners = new Set<() => void>();

  /**
   * Single source of truth: Tampermonkey storage, read on every access.
   * No in-memory copy, so changes synced from another machine are seen immediately.
   * Returns a fresh Map: mutate it, then save it with StorageService.setSuppliers().
   */
  private static get suppliers(): Map<string, SupplierEntry> {
    return StorageService.getSuppliers();
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
  static captureFromResponse(data: SkyscannerApiResponse): void {
    const filters = data?.filters;
    if (!Array.isArray(filters)) return;

    const supplierFilter = filters.find(
      (f: SupplierFilter) => f.filter_type === 'filter_type_suppliers',
    );
    if (!supplierFilter) return;

    const options = supplierFilter?.string_value_filter?.options;
    if (!Array.isArray(options)) return;

    const suppliers = this.suppliers;
    const updateState = { updated: false };

    options.forEach((opt) => {
      const id = String(opt.id);
      const name = String(opt.display_text ?? '');
      const minPrice = opt.price_range?.min != null
        ? Number(opt.price_range.min)
        : null;

      const existing = suppliers.get(id);
      // Preserve status when updating
      const status = existing?.status ?? 'included';

      if (!existing || existing.name !== name || existing.minPrice !== minPrice) {
        suppliers.set(id, { id, name, minPrice, status });
        updateState.updated = true;
      }
    });

    if (updateState.updated) {
      StorageService.setSuppliers(suppliers);
      Logger.info(`SupplierRegistry: updated → ${suppliers.size} supplier(s).`);
      this.listeners.forEach((listener) => listener());
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
    this.suppliers.forEach((entry, id) => {
      if (entry.status === 'included') {
        included.push(id);
      }
    });
    return included;
  }

  /** IDs of suppliers with status 'excluded'. */
  static getExcludedIds(): string[] {
    const excluded: string[] = [];
    this.suppliers.forEach((entry, id) => {
      if (entry.status === 'excluded') {
        excluded.push(id);
      }
    });
    return excluded;
  }

  /** Count of excluded suppliers. */
  static getExcludedCount(): number {
    let count = 0;
    Array.from(this.suppliers.values()).forEach((entry) => {
      if (entry.status === 'excluded') count++;
    });
    return count;
  }

  /** Supplier count. */
  static get size(): number {
    return this.suppliers.size;
  }

  // ── Mutations ───────────────────────────────────────────────────────────

  /** Toggles a single supplier's status. */
  static toggleStatus(id: string): void {
    const suppliers = this.suppliers;
    const entry = suppliers.get(id);
    if (!entry) return;

    const newStatus: SupplierStatus = entry.status === 'included' ? 'excluded' : 'included';
    suppliers.set(id, { ...entry, status: newStatus });
    StorageService.setSuppliers(suppliers);

    this.listeners.forEach((listener) => listener());
  }

  /** Sets status for multiple suppliers at once. */
  static setStatus(ids: string[], status: SupplierStatus): void {
    const suppliers = this.suppliers;
    const updateState = { updated: false };

    ids.forEach((id) => {
      const entry = suppliers.get(id);
      if (entry && entry.status !== status) {
        suppliers.set(id, { ...entry, status });
        updateState.updated = true;
      }
    });

    if (updateState.updated) {
      StorageService.setSuppliers(suppliers);
      this.listeners.forEach((listener) => listener());
    }
  }

  /** Sets status for all suppliers. */
  static setAllStatus(status: SupplierStatus): void {
    const suppliers = this.suppliers;
    const updateState = { updated: false };

    suppliers.forEach((entry, id) => {
      if (entry.status !== status) {
        suppliers.set(id, { ...entry, status });
        updateState.updated = true;
      }
    });

    if (updateState.updated) {
      StorageService.setSuppliers(suppliers);
      this.listeners.forEach((listener) => listener());
    }
  }

  /** Atomic commit from Dashboard (batch update). */
  static commit(updates: Map<string, SupplierEntry>): void {
    StorageService.setSuppliers(updates);
    Logger.info(`SupplierRegistry: committed ${updates.size} supplier(s).`);
    this.listeners.forEach((listener) => listener());
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
