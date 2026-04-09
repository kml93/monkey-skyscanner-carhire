/**
 * UI Boot Controller — auto-configures the Skyscanner interface on page load.
 *
 * Execution sequence (one-shot, runs once per navigation):
 * 1. Wait for the sidebar to be rendered
 * 2. Change sort to "Le moins cher" (if enabled)
 * 3. Click "Tout sélectionner" (selects all + expands full list)
 * 4. Wait for the full supplier list to render
 * 5. Collapse all accordion sections except "Prestataire"
 *
 * All actions are batched to minimize anti-bot detection risk.
 *
 * Single Responsibility: only handles initial UI preparation.
 */

import { DomObserver } from './DomObserver';
import { Logger } from './Logger';
import { SELECTORS } from './selectors';
import type { AutoConfig } from './types';

export class UIBootController {
  private static booted = false;
  private static isWaiting = false;
  private static appRoot: Element | null = null;

  /**
   * Runs the full boot sequence.
   * Idempotent — will not re-run if already completed or waiting.
   */
  static async boot(config: AutoConfig, onReadyCallback?: () => void): Promise<void> {
    if (this.booted || this.isWaiting) return;
    this.isWaiting = true;

    try {
      // Initialize the app root container once (C1 - scope reduction)
      this.appRoot = document.querySelector(SELECTORS.sidebar.container) || document.querySelector('[data-testid="car-hire-results"]') || document.querySelector('#app-root');

      // Wait for the sidebar to be present in the DOM
      await DomObserver.waitForElement(SELECTORS.sidebar.container, 15_000);

      // Wait for all loaders/spinners to disappear
      await this.waitTillReady();

      // Execute all preparations in rapid succession
      if (config.sortCheapest) this.forceCheapestSort();
      if (config.expandAllSuppliers) await this.expandAllSuppliers();
      if (config.foldAccordions) this.foldAccordions();

      this.booted = true;
      this.isWaiting = false;
      Logger.info('Boot sequence completed.');

      if (onReadyCallback) {
        onReadyCallback();
      }
    } catch (error) {
      this.isWaiting = false;
      Logger.error('Boot sequence failed:', error);
    }
  }

  /** Resets boot state to allow re-execution (e.g. after SPA navigation). */
  static reset(): void {
    this.booted = false;
    this.isWaiting = false;
    this.appRoot = null;
  }

  /** Returns whether the boot sequence has completed. */
  static hasBooted(): boolean {
    return this.booted;
  }

  // ── Wait Logic ─────────────────────────────────────────────────────────

  /**
   * Waits for all Skyscanner loading indicators to disappear from the DOM.
   *
   * Uses MutationObserver instead of polling — zero CPU when DOM is stable.
   * Reactively detects when loaders are removed, then verifies stability
   * with a debounced check to avoid expensive querySelector calls during
   * active DOM mutations.
   */
  private static waitTillReady(): Promise<void> {
    const target = this.appRoot instanceof Element ? this.appRoot : document.documentElement;

    // Fast path: ID lookup is O(1) via browser internal hash map
    const hasProgressBar = (): boolean => !!document.getElementById('results-loading-bar');

    // Class-wildcard selectors — expensive, scoped to subtree
    const hasSpinner = (): boolean => !!target.querySelector(`${SELECTORS.loaders.spinnerPanel}, ${SELECTORS.loaders.spinnerContainer}`);

    const isBusy = (): boolean => hasProgressBar() || hasSpinner();

    return new Promise((resolve) => {
      // Immediate check — skip observer if already clean
      if (!isBusy()) {
        resolve();
        return;
      }

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let stabilityCount = 0;
      const requiredStability = 2;

      const cleanup = () => {
        observer.disconnect();
        if (debounceTimer) clearTimeout(debounceTimer);
      };

      const check = () => {
        debounceTimer = null;

        if (!isBusy()) {
          stabilityCount++;
          if (stabilityCount >= requiredStability) {
            cleanup();
            resolve();
            return;
          }
          // Re-verify after short delay for stability
          debounceTimer = setTimeout(check, 300);
        } else {
          stabilityCount = 0;
          // Loader still present — wait for next DOM mutation
        }
      };

      // Observe DOM mutations — check loaders only when something changes
      const observer = new MutationObserver(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        // Debounce: coalesce rapid mutations into a single check
        debounceTimer = setTimeout(check, 300);
      });

      observer.observe(target, { childList: true, subtree: true });

      // Safety timeout — prevent infinite wait
      setTimeout(() => {
        cleanup();
        resolve();
      }, 15_000);
    });
  }

  // ── Sort ───────────────────────────────────────────────────────────────

  /**
   * Forces the sort dropdown to "Cheapest" if not already selected.
   * Dispatches a native `change` event to trigger React's state update.
   */
  private static forceCheapestSort(): void {
    const select = this.getSortSelect();

    if (!select) {
      Logger.warn('Sort dropdown not found.');
      return;
    }

    if (select.value === SELECTORS.sortValues.cheapest) return;

    this.setSortValue(select, SELECTORS.sortValues.cheapest);

    Logger.info('Sort forced to "Cheapest".');
  }

  // ── Expand Suppliers ───────────────────────────────────────────────────

  /**
   * Clicks "Select all" (or French "Tout sélectionner") which both:
   * - Expands the full list (popular + all suppliers)
   * - Checks all supplier checkboxes
   *
   * Then waits for the full list to render before proceeding.
   */
  private static async expandAllSuppliers(): Promise<void> {
    // Find "Select all" / "Tout sélectionner" button by text content
    const filterButtons = document.querySelectorAll<HTMLButtonElement>(SELECTORS.buttons.filterActionWildcard);

    const selectAllTexts = ['Tout sélectionner', 'Select all'];
    let selectAllBtn: HTMLButtonElement | null = null;
    for (const btn of filterButtons) {
      const text = btn.textContent?.trim() ?? '';
      if (selectAllTexts.includes(text)) {
        selectAllBtn = btn;
        break;
      }
    }

    if (!selectAllBtn) {
      Logger.warn('"Select all" button not found.');
      // Fallback: try just "Show all suppliers" / "Afficher tous les fournisseurs"
      const showAllBtn = document.querySelector<HTMLButtonElement>(SELECTORS.buttons.showAllSuppliers);
      showAllBtn?.click();
      return;
    }

    // NOTE: This click triggers a synchronous React re-render (~80-90ms) which
    // Chrome flags as [Violation]. This is inherent — React must expand and
    // render the full supplier list. No scheduling trick can avoid it.
    // The only alternative would be Approach D (API interception).
    selectAllBtn.click();

    Logger.info('Clicked "Select all" (expand + check all).');

    // Wait for the supplier list to finish rendering
    await this.delay(800);
  }

  // ── Fold Accordions ────────────────────────────────────────────────────

  /**
   * Collapses ALL expanded accordion sections (including Provider/Prestataire).
   * Footer-level sections (Explorer, Company, etc.) are still ignored.
   */
  private static foldAccordions(): void {
    const sidebarContainer = document.querySelector(SELECTORS.sidebar.container);
    if (!sidebarContainer) return;

    // Only target accordion buttons WITHIN the sidebar (not footer)
    const accordionButtons = sidebarContainer.querySelectorAll<HTMLButtonElement>(SELECTORS.accordion.toggleButton);

    const footerLabels = SELECTORS.accordionLabels.footerSections;

    let foldedCount = 0;

    for (const btn of accordionButtons) {
      const label = btn.textContent?.trim() ?? '';
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      // Skip if already collapsed
      if (!isExpanded) continue;
      // Skip footer-level sections
      if ((footerLabels as readonly string[]).includes(label)) continue;

      btn.click();
      foldedCount++;
    }

    if (foldedCount > 0) {
      Logger.info(`Folded ${foldedCount} accordion section(s).`);
    }
  }

  // ── Utility ────────────────────────────────────────────────────────────

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── Sort Helpers ───────────────────────────────────────────────────────

  /** Finds the sort dropdown select element. */
  private static getSortSelect(): HTMLSelectElement | null {
    return document.querySelector<HTMLSelectElement>(SELECTORS.sort.dropdown) ?? document.querySelector<HTMLSelectElement>(SELECTORS.sort.dropdownByTestId);
  }

  /** Sets sort value using native setter to bypass React's controlled input. */
  private static setSortValue(select: HTMLSelectElement, value: string): void {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
    nativeSetter?.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ── Re-fetch ───────────────────────────────────────────────────────────

  /**
   * Triggers a Skyscanner re-fetch by toggling the sort dropdown.
   *
   * 1. Save current sort value
   * 2. Toggle to alternative (cheapest ↔ recommended)
   * 3. Wait for loading to complete
   * 4. Toggle back to original value
   * 5. Wait for loading to complete again
   */
  static async triggerRefetch(): Promise<void> {
    const select = this.getSortSelect();

    if (!select) {
      Logger.warn('Sort dropdown not found — skipping re-fetch.');
      return;
    }

    const originalValue = select.value;
    const alternativeValue = originalValue === SELECTORS.sortValues.cheapest ? SELECTORS.sortValues.recommended : SELECTORS.sortValues.cheapest;

    Logger.info(`Triggering re-fetch: ${originalValue} → ${alternativeValue} → ${originalValue}`);

    this.setSortValue(select, alternativeValue);
    await this.waitTillReady();

    this.setSortValue(select, originalValue);
    await this.waitTillReady();

    Logger.info('Re-fetch completed via sort toggle.');
  }
}
