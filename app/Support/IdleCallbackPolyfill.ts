/**
 * requestIdleCallback polyfill for Safari, which lacks it natively.
 *
 * Approximates idle scheduling with a 1 ms setTimeout so higher-priority work runs first.
 * The IdleDeadline is partial: timeRemaining() reports the time left before the
 * requested timeout, and didTimeout is always true (true idle state is undetectable).
 */
export class IdleCallbackPolyfill {
  install(): void {
    if (typeof window.requestIdleCallback === 'function') return;

    window.requestIdleCallback = (callback: IdleRequestCallback, { timeout = 0 }: IdleRequestOptions = {}): number => {
      const start = Date.now();

      return window.setTimeout(() => {
        const remaining = Math.max(0, timeout - (Date.now() - start));
        callback({ timeRemaining: () => remaining, didTimeout: true });
      }, 1);
    };

    window.cancelIdleCallback = (handle: number): void => {
      window.clearTimeout(handle);
    };
  }
}
