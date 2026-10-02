/**
 * Delays and timeouts, in milliseconds.
 */
export const timingConfig = {
  /** Upper bound before an idle-scheduled refresh runs anyway. */
  idleRefreshTimeout: 2_000,
} as const;
