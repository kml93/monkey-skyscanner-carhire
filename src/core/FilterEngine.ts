/**
 * Filter Engine — applies supplier exclusion rules to the Skyscanner DOM.
 *
 * Uses a Strategy Pattern via the FilterStrategy interface to allow
 * future extension to an "inclusion mode" (all excluded, include specific).
 *
 * Current implementation: ExclusionStrategy (all included, exclude specific).
 *
 * Execution is chunked via requestIdleCallback — clicks are spread across
 * multiple idle periods to avoid blocking the Main Thread and prevent Chrome
 * [Violation] warnings. Each click happens when the browser has free time.
 *
 * Single Responsibility: only handles the mechanical DOM checkbox manipulation.
 */

import { Logger } from './Logger';
import { SELECTORS } from './selectors';
import type { FilterStrategy, Supplier, SupplierPreference } from './types';

// ---------------------------------------------------------------------------
// Default Exclusion Strategy
// ---------------------------------------------------------------------------

/**
 * "All included by default, exclude specific suppliers."
 * Returns the IDs that should be unchecked.
 */
export class ExclusionStrategy implements FilterStrategy {
  readonly label = 'Exclusion (all included, exclude specific)';

  computeUncheckedIds(_allSupplierIds: string[], preferences: Map<string, SupplierPreference>): string[] {
    const unchecked: string[] = [];

    for (const [id, pref] of preferences) {
      if (pref.excluded) {
        unchecked.push(id);
      }
    }

    return unchecked;
  }
}

// ---------------------------------------------------------------------------
// Filter Engine
// ---------------------------------------------------------------------------

export class FilterEngine {
  private static strategy: FilterStrategy = new ExclusionStrategy();

  /** Replaces the active filter strategy (SoC — future extension point). */
  static setStrategy(strategy: FilterStrategy): void {
    this.strategy = strategy;
  }

  /** Returns the currently active strategy for UI display. */
  static getStrategy(): FilterStrategy {
    return this.strategy;
  }

  /**
   * Applies the filter rules to the Skyscanner DOM.
   *
   * Flow:
   * 1. Compute which supplier IDs should be unchecked
   * 2. Process clicks in chunks via requestIdleCallback
   * 3. Each uncheck targets the `<input>` directly (not the `<label>`)
   *
   * Chunking strategy: Process one checkbox per idle period, respecting
   * deadline.timeRemaining(). If the deadline expires before all IDs are
   * processed, reschedule for the next idle period.
   *
   * @param preferences User's supplier preferences from storage
   * @returns Promise that resolves when all checkboxes are processed
   */
  static apply(preferences: Map<string, SupplierPreference>): Promise<void> {
    return new Promise((resolve) => {
      const allSupplierIds = this.scrapeSupplierIds();

      if (allSupplierIds.length === 0) {
        Logger.warn('No suppliers found in DOM.');
        resolve();
        return;
      }

      const idsToUncheck = this.strategy.computeUncheckedIds(allSupplierIds, preferences);

      if (idsToUncheck.length === 0) {
        Logger.info('No suppliers to exclude.');
        resolve();
        return;
      }

      // Chunk execution via requestIdleCallback — process checkboxes
      // one by one during browser idle periods
      const totalToProcess = idsToUncheck.length;
      let processedCount = 0;

      const processChunk = (deadline: IdleDeadline): void => {
        // Process checkboxes while we have time and IDs remaining
        while (deadline.timeRemaining() > 0 && idsToUncheck.length > 0) {
          const id = idsToUncheck.shift()!;
          const checkbox = document.querySelector<HTMLInputElement>(SELECTORS.supplier.checkbox(id));

          if (!checkbox) continue;
          // Only click if currently checked (avoid toggling back on)
          if (!checkbox.checked) continue;

          checkbox.click();
          processedCount++;
        }

        // If there are remaining IDs, reschedule for next idle period
        if (idsToUncheck.length > 0) {
          requestIdleCallback(processChunk, { timeout: 1000 });
        } else {
          Logger.info(`Chunked excluded ${processedCount}/${totalToProcess} supplier(s) ` + `via requestIdleCallback.`);
          resolve();
        }
      };

      // Start processing with a 1s safety timeout (forces execution if
      // the browser never becomes idle)
      requestIdleCallback(processChunk, { timeout: 1000 });
    });
  }

  /**
   * Scrapes all currently visible supplier checkboxes from the DOM.
   * Returns structured Supplier data for UI rendering.
   */
  static scrapeSuppliers(): Supplier[] {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(SELECTORS.supplier.anyCheckbox);

    const suppliers: Supplier[] = [];
    const seenIds = new Set<string>();

    for (const cb of checkboxes) {
      const testId = cb.getAttribute('data-testid') ?? '';
      // Extract numeric ID from "supplier-{ID}-checkbox"
      const match = testId.match(/^supplier-(\d+)-checkbox$/);
      if (!match) continue;

      const id = match[1];

      // Deduplicate — popular suppliers appear twice
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      // Get name and price from dedicated data-testid elements
      const nameEl = document.querySelector(SELECTORS.supplier.name(id));
      const priceEl = document.querySelector(SELECTORS.supplier.price(id));
      const priceLabel = priceEl?.textContent?.trim() ?? '';

      // Parse numerical price for sorting (remove currency symbols, spaces, etc.)
      const price = parseInt(priceLabel.replace(/[^\d]/g, ''), 10) || 0;

      suppliers.push({
        id,
        name: nameEl?.textContent?.trim() ?? `Supplier #${id}`,
        priceLabel,
        price,
        checked: cb.checked,
      });
    }

    return suppliers;
  }

  // ── Internal ───────────────────────────────────────────────────────────

  /** Quick scrape of just supplier IDs (cheaper than full scrape). */
  private static scrapeSupplierIds(): string[] {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(SELECTORS.supplier.anyCheckbox);

    const ids: string[] = [];
    const seen = new Set<string>();

    for (const cb of checkboxes) {
      const testId = cb.getAttribute('data-testid') ?? '';
      const match = testId.match(/^supplier-(\d+)-checkbox$/);
      if (!match) continue;

      const id = match[1];
      if (seen.has(id)) continue;
      seen.add(id);

      ids.push(id);
    }

    return ids;
  }
}
