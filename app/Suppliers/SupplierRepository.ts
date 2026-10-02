import type { StoredValue } from '@app/Storage/StoredValue';
import type { Logger } from '@app/Support/Logger';
import type { SupplierDetails } from './Data/SupplierDetails';
import type { SupplierEntry } from './Data/SupplierEntry';
import type { SupplierMap } from './Data/SupplierMap';

/**
 * Single source of truth for suppliers, keyed by supplier ID.
 *
 * Reads storage on every access (no in-memory copy), so writes from other tabs are seen immediately.
 * Every returned Map is a fresh copy, safe to mutate.
 */
export class SupplierRepository {
  private readonly value: StoredValue<Record<string, SupplierEntry>>;
  private readonly logger: Logger;

  constructor(value: StoredValue<Record<string, SupplierEntry>>, logger: Logger) {
    this.value = value;
    this.logger = logger;
  }

  all(): SupplierMap {
    return new Map(Object.entries(this.value.get()));
  }

  includedIds(): string[] {
    return Object.values(this.value.get())
      .filter((entry) => entry.status === 'included')
      .map((entry) => entry.id);
  }

  /**
   * Adds new suppliers and refreshes the details of known ones, keeping their status.
   * Saves only when something changed.
   */
  merge(captured: SupplierDetails[]): void {
    const suppliers = this.all();
    const changed = captured.filter((details) => {
      const existing = suppliers.get(details.id);
      return existing?.name !== details.name || existing.minPrice !== details.minPrice;
    });
    if (changed.length === 0) return;

    changed.forEach((details) => {
      suppliers.set(details.id, { status: 'included', ...suppliers.get(details.id), ...details });
    });
    this.save(suppliers);
    this.logger.info(`SupplierRepository: merged ${changed.length} change(s) → ${suppliers.size} supplier(s).`);
  }

  /** Replaces every supplier (dashboard commit). */
  replace(suppliers: SupplierMap): void {
    this.save(suppliers);
    this.logger.info(`SupplierRepository: replaced with ${suppliers.size} supplier(s).`);
  }

  /** Notified on local saves and on saves from other tabs. Returns the unsubscribe function. */
  onChange(listener: (suppliers: SupplierMap) => void): () => void {
    return this.value.subscribe((raw) => listener(new Map(Object.entries(raw))));
  }

  private save(suppliers: SupplierMap): void {
    this.value.set(Object.fromEntries(suppliers));
  }
}
