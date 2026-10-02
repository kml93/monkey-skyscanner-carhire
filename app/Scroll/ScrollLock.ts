interface ScrollMethods {
  readonly scrollTo: typeof window.scrollTo;
  readonly scroll: typeof window.scroll;
  readonly scrollIntoView: typeof Element.prototype.scrollIntoView;
}

/**
 * Blocks Skyscanner's programmatic scroll-to-top (`window.scrollTo(0, 0)`,
 * `Element.scrollIntoView()`) fired after every filter interaction.
 * User-initiated scroll (wheel, touch, keyboard) is never affected.
 *
 * The native methods are patched on first enable and restored by uninstall().
 */
export class ScrollLock {
  private enabled = false;
  private originals: ScrollMethods | null = null;

  setEnabled(enabled: boolean): void {
    if (enabled) this.install();
    this.enabled = enabled;
  }

  uninstall(): void {
    if (!this.originals) return;

    window.scrollTo = this.originals.scrollTo;
    window.scroll = this.originals.scroll;
    Element.prototype.scrollIntoView = this.originals.scrollIntoView;
    this.originals = null;
    this.enabled = false;
  }

  private install(): void {
    if (this.originals) return;

    const originals: ScrollMethods = {
      scrollTo: window.scrollTo.bind(window),
      scroll: window.scroll.bind(window),
      scrollIntoView: Element.prototype.scrollIntoView,
    };
    const isLocked = (): boolean => this.enabled;
    this.originals = originals;

    window.scrollTo = ((...args: Parameters<typeof window.scrollTo>) => {
      if (isLocked()) return;
      originals.scrollTo(...args);
    }) as typeof window.scrollTo;
    window.scroll = ((...args: Parameters<typeof window.scroll>) => {
      if (isLocked()) return;
      originals.scroll(...args);
    }) as typeof window.scroll;
    Element.prototype.scrollIntoView = function (this: Element, ...args: Parameters<ScrollMethods['scrollIntoView']>) {
      if (isLocked()) return;
      originals.scrollIntoView.apply(this, args);
    };
  }
}
