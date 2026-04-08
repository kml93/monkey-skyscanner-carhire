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

  /**
   * Runs the full boot sequence.
   * Idempotent — will not re-run if already completed or waiting.
   */
  static async boot(config: AutoConfig, onReadyCallback?: () => void): Promise<void> {
    if (this.booted || this.isWaiting) return;
    this.isWaiting = true;

    try {
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
  }

  /** Returns whether the boot sequence has completed. */
  static hasBooted(): boolean {
    return this.booted;
  }

  // ── Wait Logic ─────────────────────────────────────────────────────────

  /**
   * Waits for all Skyscanner loading indicators to disappear from the DOM.
   */
  private static waitTillReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkDelay = 200;
      let stabilityCount = 0;
      const requiredStability = 2; // Needs to be clean for 400ms

      const interval = setInterval(() => {
        const hasProgressBar = !!document.querySelector(SELECTORS.loaders.progressBar);
        const hasSpinnerPanel = !!document.querySelector(SELECTORS.loaders.spinnerPanel);
        const hasSpinnerContainer = !!document.querySelector(SELECTORS.loaders.spinnerContainer);

        const isBusy = hasProgressBar || hasSpinnerPanel || hasSpinnerContainer;

        if (!isBusy) {
          stabilityCount++;
          if (stabilityCount >= requiredStability) {
            clearInterval(interval);
            resolve();
          }
        } else {
          stabilityCount = 0;
        }
      }, checkDelay);
    });
  }

  // ── Sort ───────────────────────────────────────────────────────────────

  /**
   * Forces the sort dropdown to "Cheapest" if not already selected.
   * Dispatches a native `change` event to trigger React's state update.
   */
  private static forceCheapestSort(): void {
    const select = document.querySelector<HTMLSelectElement>(SELECTORS.sort.dropdown) ?? document.querySelector<HTMLSelectElement>(SELECTORS.sort.dropdownByTestId);

    if (!select) {
      Logger.warn('Sort dropdown not found.');
      return;
    }

    if (select.value === SELECTORS.sortValues.cheapest) return;

    // Set value and dispatch native change event for React
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;

    nativeInputValueSetter?.call(select, SELECTORS.sortValues.cheapest);
    select.dispatchEvent(new Event('change', { bubbles: true }));

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

    selectAllBtn.click();
    Logger.info('Clicked "Select all" (expand + check all).');

    // Wait for the supplier list to finish rendering
    await this.delay(800);
  }

  // ── Fold Accordions ────────────────────────────────────────────────────

  /**
   * Collapses all expanded accordion sections EXCEPT "Provider" / "Prestataire".
   * Also ignores footer-level accordions.
   */
  private static foldAccordions(): void {
    const sidebarContainer = document.querySelector(SELECTORS.sidebar.container);
    if (!sidebarContainer) return;

    // Only target accordion buttons WITHIN the sidebar (not footer)
    const accordionButtons = sidebarContainer.querySelectorAll<HTMLButtonElement>(SELECTORS.accordion.toggleButton);

    const keepOpenLabels = SELECTORS.accordionLabels.provider;
    const footerLabels = SELECTORS.accordionLabels.footerSections;

    let foldedCount = 0;

    for (const btn of accordionButtons) {
      const label = btn.textContent?.trim() ?? '';
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      // Skip if already collapsed
      if (!isExpanded) continue;
      // Skip the provider section — keep it open
      if ((keepOpenLabels as readonly string[]).includes(label)) continue;
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
}
