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

  /**
   * Starts observing for SPA navigation (URL changes).
   */
  static start(): void {
    if (this.urlObserverInterval) return;

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
