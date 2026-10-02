import { selectorsConfig } from '@config/selectors';

import type { Logger } from '@app/Support/Logger';

/**
 * Makes Skyscanner fetch its results again by flipping the sort dropdown once:
 * a single change event forces the page to emit a new carhire-quotes request.
 */
export class ResultsRefresher {
  private readonly document: Document;
  private readonly logger: Logger;

  constructor(document: Document, logger: Logger) {
    this.document = document;
    this.logger = logger;
  }

  refetch(): void {
    const select = this.sortSelect();
    if (!select) {
      this.logger.warn('ResultsRefresher: sort dropdown not found — skipping re-fetch.');
      return;
    }

    const nextValue = this.nextSortValue(select.value);
    this.logger.info(`ResultsRefresher: toggling sort dropdown ${select.value} → ${nextValue}.`);
    this.setSortValue(select, nextValue);
  }

  /**
   * Re-fetches as soon as the sort dropdown exists. At startup Skyscanner renders it only
   * after its first response, so a MutationObserver waits for it (event-driven, no timers).
   */
  refetchWhenReady(): void {
    if (this.sortSelect()) {
      this.refetch();
      return;
    }

    const observer = new MutationObserver(() => {
      if (!this.sortSelect()) return;

      observer.disconnect();
      this.refetch();
    });
    observer.observe(this.document.documentElement, { childList: true, subtree: true });
  }

  private sortSelect(): HTMLSelectElement | null {
    return this.document.querySelector<HTMLSelectElement>(selectorsConfig.sort.dropdown)
      ?? this.document.querySelector<HTMLSelectElement>(selectorsConfig.sort.dropdownByTestId);
  }

  private nextSortValue(current: string): string {
    const { cheapest, recommended } = selectorsConfig.sort.values;
    return current === cheapest ? recommended : cheapest;
  }

  /** Uses the native value setter so the page's controlled React <select> sees the change. */
  private setSortValue(select: HTMLSelectElement, value: string): void {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
