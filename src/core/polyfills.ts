/**
 * Polyfills for browser APIs that are not universally supported.
 *
 * Currently provides:
 * - requestIdleCallback polyfill for Safari (which doesn't support it natively)
 *
 * Import this file early in the application bootstrap (e.g., main.tsx) to ensure
 * all polyfills are loaded before any feature code runs.
 */

// ---------------------------------------------------------------------------
// requestIdleCallback polyfill (Safari)
// ---------------------------------------------------------------------------

/**
 * Safari doesn't support requestIdleCallback natively.
 *
 * This polyfill approximates the behavior using setTimeout with a 1ms delay,
 * which allows the browser to process higher-priority work first before
 * executing the callback.
 *
 * The polyfill provides a subset of the full IdleDeadline interface:
 * - timeRemaining(): Returns the time left before the timeout
 * - didTimeout: Always true for this polyfill (we can't detect true idle state)
 */

export function registerRequestIdleCallbackPolyfill(): void {
  if (typeof window.requestIdleCallback === 'function') {
    // Already supported by the browser (Chrome, Firefox, Edge)
    return;
  }

  window.requestIdleCallback = (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ): number => {
    const timeout = options?.timeout ?? 0;
    const start = Date.now();

    const handle = window.setTimeout(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, timeout - elapsed);

      callback({
        timeRemaining: () => remaining,
        didTimeout: true,
      });
    }, 1);

    return handle;
  };

  window.cancelIdleCallback = (handle: number): void => {
    window.clearTimeout(handle);
  };
}
