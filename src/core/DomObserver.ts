/**
 * DOM Mutation Observer for Skyscanner SPA navigation detection.
 *
 * Skyscanner is a React SPA — changing dates, destination, or applying filters
 * does NOT trigger a full page reload. This module watches the DOM and URL
 * for changes to re-trigger the boot sequence when content refreshes.
 *
 * Single Responsibility: only detects DOM/navigation changes and emits callbacks.
 */

import { Logger } from './Logger';
import { SELECTORS } from './selectors';

type NavigationCallback = () => void;

export class DomObserver {
  private static observer: MutationObserver | null = null;
  private static urlObserverInterval: ReturnType<typeof setInterval> | null = null;
  private static lastKnownUrl: string = '';
  private static callbacks: Set<NavigationCallback> = new Set();

  /**
   * Starts observing for SPA navigation and result container mutations.
   * Calls registered callbacks when a meaningful change is detected.
   */
  static start(): void {
    if (this.observer) return;

    this.lastKnownUrl = window.location.href;

    // ── URL Polling (pushState / replaceState detection) ────────────────
    this.urlObserverInterval = setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastKnownUrl) {
        this.lastKnownUrl = currentUrl;
        this.notifyAll();
      }
    }, 1000);

    // ── DOM Mutation Observer ───────────────────────────────────────────
    this.observer = new MutationObserver((mutations) => {
      const hasSignificantChange = mutations.some((mutation) => {
        // Only care about childList changes in the results area
        if (mutation.type !== 'childList') return false;
        if (mutation.addedNodes.length === 0) return false;

        // Check if mutation happened in the sidebar or results container
        const target = mutation.target as Element;
        if (!target.closest) return false;

        const inSidebar = target.closest(SELECTORS.sidebar.container);
        const inResults = target.closest('[class*="results"]');

        return !!(inSidebar || inResults);
      });

      if (hasSignificantChange) {
        this.notifyAll();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /** Stops all observers and clears callbacks. */
  static stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.urlObserverInterval) {
      clearInterval(this.urlObserverInterval);
      this.urlObserverInterval = null;
    }

    this.callbacks.clear();
  }

  /** Registers a callback to be invoked on SPA navigation or result refresh. */
  static onNavigate(callback: NavigationCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  // ── Internal ───────────────────────────────────────────────────────────

  private static notifyAll(): void {
    for (const callback of this.callbacks) {
      try {
        callback();
      } catch (error) {
        Logger.error('DomObserver callback error:', error);
      }
    }
  }

  // ── Utilities ──────────────────────────────────────────────────────────

  /**
   * Waits for a specific element to appear in the DOM.
   * Resolves with the element once found, or rejects after timeout.
   */
  static waitForElement(
    selector: string,
    timeoutMs = 10_000,
    intervalMs = 200,
  ): Promise<Element> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(selector);
      if (existing) {
        resolve(existing);
        return;
      }

      const startTime = Date.now();
      const poll = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(poll);
          resolve(el);
          return;
        }

        if (Date.now() - startTime > timeoutMs) {
          clearInterval(poll);
          reject(new Error(`Element not found: ${selector} (timeout: ${timeoutMs}ms)`));
        }
      }, intervalMs);
    });
  }
}
