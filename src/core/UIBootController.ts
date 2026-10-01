/**
 * UI Boot Controller — triggers Skyscanner re-fetch on filter changes.
 */

import { Logger } from './Logger';
import { SELECTORS } from './selectors';

export class UIBootController {
  // ── Sort Helpers ───────────────────────────────────────────────────────

  /** Finds the sort dropdown select element. */
  private static getSortSelect(): HTMLSelectElement | null {
    return (
      document.querySelector<HTMLSelectElement>(SELECTORS.sort.dropdown) ??
      document.querySelector<HTMLSelectElement>(SELECTORS.sort.dropdownByTestId)
    );
  }

  /** Sets sort value using native setter to bypass React's controlled input. */
  private static setSortValue(select: HTMLSelectElement, value: string): void {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'value',
    )?.set;
    nativeSetter?.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ── Re-fetch ───────────────────────────────────────────────────────────

  /**
   * Triggers a Skyscanner re-fetch by flipping the sort dropdown once.
   * A single value change event forces React to emit a new fetch request.
   */
  static triggerRefetch(): void {
    const select = this.getSortSelect();

    if (!select) {
      Logger.warn('Sort dropdown not found — skipping re-fetch.');
      return;
    }
    const nextValue =
      select.value === SELECTORS.sortValues.cheapest
        ? SELECTORS.sortValues.recommended
        : SELECTORS.sortValues.cheapest;

    Logger.info(`Toggling sort dropdown: ${select.value} -> ${nextValue}`);
    this.setSortValue(select, nextValue);
  }
}
