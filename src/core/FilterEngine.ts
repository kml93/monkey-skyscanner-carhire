/**
 * Filter Engine — applies supplier exclusion rules to the Skyscanner DOM.
 *
 * Uses a Strategy Pattern via the FilterStrategy interface to allow
 * future extension to an "inclusion mode" (all excluded, include specific).
 *
 * Current implementation: ExclusionStrategy (all included, exclude specific).
 *
 * Execution is batched — all unchecks happen in a single requestAnimationFrame
 * to avoid triggering Skyscanner's anti-bot per-click detection.
 *
 * Single Responsibility: only handles the mechanical DOM checkbox manipulation.
 */

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
  readonly label = 'Exclusion (tout inclus, on exclut)';

  computeUncheckedIds(
    _allSupplierIds: string[],
    preferences: Map<string, SupplierPreference>,
  ): string[] {
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
   * 2. Batch all unchecks in a single requestAnimationFrame
   * 3. Each uncheck targets the `<input>` directly (not the `<label>`)
   *
   * @param preferences User's supplier preferences from storage
   */
  static apply(preferences: Map<string, SupplierPreference>): void {
    const allSupplierIds = this.scrapeSupplierIds();

    if (allSupplierIds.length === 0) {
      console.warn('[SkyScannerDashboard] No suppliers found in DOM.');
      return;
    }

    const idsToUncheck = this.strategy.computeUncheckedIds(allSupplierIds, preferences);

    if (idsToUncheck.length === 0) {
      console.info('[SkyScannerDashboard] No suppliers to exclude.');
      return;
    }

    // Batch execution in a single animation frame
    requestAnimationFrame(() => {
      let uncheckedCount = 0;

      for (const id of idsToUncheck) {
        const checkbox = document.querySelector<HTMLInputElement>(
          SELECTORS.supplier.checkbox(id),
        );

        if (!checkbox) continue;
        // Only click if currently checked (avoid toggling back on)
        if (!checkbox.checked) continue;

        checkbox.click();
        uncheckedCount++;
      }

      console.info(
        `[SkyScannerDashboard] Batch excluded ${uncheckedCount} supplier(s).`,
      );
    });
  }

  /**
   * Scrapes all currently visible supplier checkboxes from the DOM.
   * Returns structured Supplier data for UI rendering.
   */
  static scrapeSuppliers(): Supplier[] {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      SELECTORS.supplier.anyCheckbox,
    );

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

      suppliers.push({
        id,
        name: nameEl?.textContent?.trim() ?? `Supplier #${id}`,
        priceLabel: priceEl?.textContent?.trim() ?? '',
        checked: cb.checked,
      });
    }

    return suppliers;
  }

  // ── Internal ───────────────────────────────────────────────────────────

  /** Quick scrape of just supplier IDs (cheaper than full scrape). */
  private static scrapeSupplierIds(): string[] {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      SELECTORS.supplier.anyCheckbox,
    );

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
