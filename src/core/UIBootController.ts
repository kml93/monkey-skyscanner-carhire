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
import { SELECTORS } from './selectors';
import type { AutoConfig } from './types';

export class UIBootController {
  private static booted = false;

  /**
   * Runs the full boot sequence.
   * Idempotent — will not re-run if already completed.
   */
  static async boot(config: AutoConfig): Promise<void> {
    if (this.booted) return;

    try {
      // Wait for the sidebar to be present in the DOM
      await DomObserver.waitForElement(SELECTORS.sidebar.container, 15_000);

      // Small delay to let Skyscanner fully hydrate React
      await this.delay(1_500);

      // Execute all preparations in rapid succession
      if (config.sortCheapest) this.forceCheapestSort();
      if (config.expandAllSuppliers) await this.expandAllSuppliers();
      if (config.foldAccordions) this.foldAccordions();

      this.booted = true;
      console.info('[SkyScannerDashboard] Boot sequence completed.');
    } catch (error) {
      console.error('[SkyScannerDashboard] Boot sequence failed:', error);
    }
  }

  /** Resets boot state to allow re-execution (e.g. after SPA navigation). */
  static reset(): void {
    this.booted = false;
  }

  /** Returns whether the boot sequence has completed. */
  static hasBooted(): boolean {
    return this.booted;
  }

  // ── Sort ───────────────────────────────────────────────────────────────

  /**
   * Forces the sort dropdown to "Le moins cher" if not already selected.
   * Dispatches a native `change` event to trigger React's state update.
   */
  private static forceCheapestSort(): void {
    const select = document.querySelector<HTMLSelectElement>(
      SELECTORS.sort.dropdown,
    ) ?? document.querySelector<HTMLSelectElement>(
      SELECTORS.sort.dropdownByTestId,
    );

    if (!select) {
      console.warn('[SkyScannerDashboard] Sort dropdown not found.');
      return;
    }

    if (select.value === SELECTORS.sortValues.cheapest) return;

    // Set value and dispatch native change event for React
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'value',
    )?.set;

    nativeInputValueSetter?.call(select, SELECTORS.sortValues.cheapest);
    select.dispatchEvent(new Event('change', { bubbles: true }));

    console.info('[SkyScannerDashboard] Sort forced to "Le moins cher".');
  }

  // ── Expand Suppliers ───────────────────────────────────────────────────

  /**
   * Clicks "Tout sélectionner" which both:
   * - Expands the full list (popular + all suppliers)
   * - Checks all supplier checkboxes
   *
   * Then waits for the full list to render before proceeding.
   */
  private static async expandAllSuppliers(): Promise<void> {
    // Find "Tout sélectionner" button by text content
    const filterButtons = document.querySelectorAll<HTMLButtonElement>(
      SELECTORS.buttons.filterActionWildcard,
    );

    let selectAllBtn: HTMLButtonElement | null = null;
    for (const btn of filterButtons) {
      if (btn.textContent?.trim() === 'Tout sélectionner') {
        selectAllBtn = btn;
        break;
      }
    }

    if (!selectAllBtn) {
      console.warn('[SkyScannerDashboard] "Tout sélectionner" button not found.');
      // Fallback: try just "Afficher tous les fournisseurs"
      const showAllBtn = document.querySelector<HTMLButtonElement>(
        SELECTORS.buttons.showAllSuppliers,
      );
      showAllBtn?.click();
      return;
    }

    selectAllBtn.click();
    console.info('[SkyScannerDashboard] Clicked "Tout sélectionner" (expand + check all).');

    // Wait for the supplier list to finish rendering
    await this.delay(800);
  }

  // ── Fold Accordions ────────────────────────────────────────────────────

  /**
   * Collapses all expanded accordion sections EXCEPT "Prestataire".
   * Also ignores footer-level accordions (Explorer, Entreprise, etc.).
   */
  private static foldAccordions(): void {
    const sidebarContainer = document.querySelector(SELECTORS.sidebar.container);
    if (!sidebarContainer) return;

    // Only target accordion buttons WITHIN the sidebar (not footer)
    const accordionButtons = sidebarContainer.querySelectorAll<HTMLButtonElement>(
      SELECTORS.accordion.toggleButton,
    );

    const keepOpen = SELECTORS.accordionLabels.prestataire;
    const footerLabels = SELECTORS.accordionLabels.footerSections;

    let foldedCount = 0;

    for (const btn of accordionButtons) {
      const label = btn.textContent?.trim() ?? '';
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      // Skip if already collapsed
      if (!isExpanded) continue;
      // Skip the "Prestataire" section — keep it open
      if (label === keepOpen) continue;
      // Skip footer-level sections
      if ((footerLabels as readonly string[]).includes(label)) continue;

      btn.click();
      foldedCount++;
    }

    if (foldedCount > 0) {
      console.info(`[SkyScannerDashboard] Folded ${foldedCount} accordion section(s).`);
    }
  }

  // ── Utility ────────────────────────────────────────────────────────────

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
