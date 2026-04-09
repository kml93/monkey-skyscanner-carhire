/**
 * Navigation Observer for Skyscanner SPA.
 *
 * Skyscanner is a React SPA. Changing dates, destination, or applying filters
 * updates the URL without a full reload. This module watches ONLY the URL
 * for changes to let the App know a new search has been initiated.
 *
 * Single Responsibility: only detects URL changes and emits callbacks.
 */

import { Logger } from './Logger';

type NavigationCallback = () => void;

export class DomObserver {
  private static urlObserverInterval: ReturnType<typeof setInterval> | null = null;
  private static lastKnownUrl: string = '';
  private static callbacks: Set<NavigationCallback> = new Set();
  private static appRoot: Element | null = null;

  /**
   * Starts observing for SPA navigation (URL changes).
   */
  static start(): void {
    if (this.urlObserverInterval) return;

    // Initialize app root for scoped queries (C1)
    this.appRoot = document.querySelector('[data-testid="side-container-filters-container"]') ||
                   document.querySelector('[data-testid="car-hire-results"]') ||
                   document.querySelector('#app-root');

    this.lastKnownUrl = window.location.href;

    // ── URL Polling ─────────────────────────────────────────────────────
    // A simple polling interval is robust across history API and hash changes.
    this.urlObserverInterval = setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastKnownUrl) {
        this.lastKnownUrl = currentUrl;
        this.notifyAll();
      }
    }, 500);
  }

  /** Stops all observers and clears callbacks. */
  static stop(): void {
    if (this.urlObserverInterval) {
      clearInterval(this.urlObserverInterval);
      this.urlObserverInterval = null;
    }
    this.callbacks.clear();
    this.appRoot = null;
  }

  /** Registers a callback to be invoked on SPA navigation. */
  static onNavigate(callback: NavigationCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private static notifyAll(): void {
    for (const callback of this.callbacks) {
      try {
        callback();
      } catch (error) {
        Logger.error('DomObserver callback error:', error);
      }
    }
  }

  /**
   * Waits for a specific element to appear in the DOM.
   * Uses MutationObserver instead of polling (C3 - reactive DOM observation).
   */
  static waitForElement(
    selector: string,
    timeoutMs = 10_000,
  ): Promise<Element> {
    return new Promise((resolve, reject) => {
      // Check immediately first
      const existing = (this.appRoot || document).querySelector(selector);
      if (existing) {
        resolve(existing);
        return;
      }

      // Use MutationObserver to react to DOM changes (C3)
      const observer = new MutationObserver(() => {
        const el = (this.appRoot || document).querySelector(selector);
        if (el) {
          // Clear timeout if element is found
          const timeoutId = (observer as unknown as { _timeoutId: ReturnType<typeof setTimeout> })._timeoutId;
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          observer.disconnect();
          resolve(el);
        }
      });

      // Observe the scoped root or document as fallback
      const target = this.appRoot || document;
      const observeOptions: MutationObserverInit = {
        childList: true,
        subtree: true,
      };

      // If observing document, we need to specify the root node
      observer.observe(target === document ? document.documentElement : target, observeOptions);

      // Timeout fallback
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element not found: ${selector} (timeout: ${timeoutMs}ms)`));
      }, timeoutMs);

      // Store timeout ID for cleanup if element is found
      (observer as unknown as { _timeoutId: ReturnType<typeof setTimeout> })._timeoutId = timeoutId;
    });
  }
}
