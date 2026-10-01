/**
 * Global scroll interceptor to prevent Skyscanner's programmatic scroll-to-top.
 *
 * Skyscanner calls `window.scrollTo(0, 0)` and `Element.scrollIntoView()`
 * after every filter interaction, causing jarring page jumps.
 *
 * This module monkey-patches those methods while preserving user-initiated
 * scroll (wheel, touch, keyboard). The interceptor can be toggled on/off.
 *
 * Single Responsibility: only handles scroll interception.
 */

type ScrollToFn = typeof window.scrollTo;
type ScrollIntoViewFn = typeof Element.prototype.scrollIntoView;
type ScrollFn = typeof window.scroll;

export class ScrollInterceptor {
  private static enabled = false;
  private static installed = false;

  // Preserved originals
  private static originalScrollTo: ScrollToFn;
  private static originalScroll: ScrollFn;
  private static originalScrollIntoView: ScrollIntoViewFn;

  /**
   * Installs the scroll interceptor by patching native methods.
   * Safe to call multiple times — idempotent.
   */
  static install(): void {
    if (this.installed) return;

    this.originalScrollTo = window.scrollTo.bind(window);
    this.originalScroll = window.scroll.bind(window);
    this.originalScrollIntoView = Element.prototype.scrollIntoView;

    // Patch window.scrollTo
    window.scrollTo = ((...args: Parameters<ScrollToFn>) => {
      if (this.enabled) return;
      this.originalScrollTo(...args);
    }) as ScrollToFn;

    // Patch window.scroll (alias of scrollTo)
    window.scroll = ((...args: Parameters<ScrollFn>) => {
      if (this.enabled) return;
      this.originalScroll(...args);
    }) as ScrollFn;

    // Patch Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (
      this: Element,
      ...args: Parameters<ScrollIntoViewFn>
    ) {
      if (ScrollInterceptor.enabled) return;
      ScrollInterceptor.originalScrollIntoView.apply(this, args);
    };

    this.installed = true;
  }

  /**
   * Uninstalls the interceptor and restores original scroll methods.
   */
  static uninstall(): void {
    if (!this.installed) return;

    window.scrollTo = this.originalScrollTo;
    window.scroll = this.originalScroll;
    Element.prototype.scrollIntoView = this.originalScrollIntoView;

    this.installed = false;
    this.enabled = false;
  }

  /** Enables scroll blocking (all programmatic scrolls are suppressed). */
  static enable(): void {
    if (!this.installed) this.install();
    this.enabled = true;
  }

  /** Disables scroll blocking (programmatic scrolls pass through). */
  static disable(): void {
    this.enabled = false;
  }

  /** Returns whether scroll interception is currently active. */
  static isEnabled(): boolean {
    return this.enabled;
  }
}
