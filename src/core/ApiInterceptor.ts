/**
 * API Interceptor — patches window.fetch for supplier data capture and filtering.
 *
 * Two independent concerns:
 *   1. RESPONSE CAPTURE (always active when installed):
 *      Captures supplier data from carhire-quotes responses into SupplierRegistry.
 *      This populates the Dashboard with all available suppliers without DOM dependency.
 *
 *   2. REQUEST FILTERING (only when filterEnabled = true):
 *      Builds `filters=suppliers:...` from SupplierRegistry (registry IDs minus
 *      user exclusions), replacing the existing param. Controlled by config.apiFilter.
 *
 * Single Responsibility: only handles fetch interception and URL transformation.
 */

import { Logger } from './Logger';
import { SupplierRegistry } from './SupplierRegistry';
import type { SupplierPreference } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** URL substring that identifies carhire-quotes API requests. */
const QUOTES_PATH = '/g/carhire-quotes/';

/** Prefix for the supplier filter query parameter. */
const SUPPLIERS_FILTER_PREFIX = 'suppliers:';

// ---------------------------------------------------------------------------
// API Interceptor
// ---------------------------------------------------------------------------

export class ApiInterceptor {
  private static originalFetch: typeof window.fetch | null = null;
  private static installed = false;

  /** Whether request filtering is active (config.apiFilter). */
  private static filterEnabled = false;

  /** Set of excluded vendor IDs (numeric string → true). */
  private static excludedVndrIds: Set<string> = new Set();

  // ── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Installs the fetch interceptor.
   * Idempotent — safe to call multiple times (updates preferences only).
   *
   * Always captures responses. Request filtering is controlled by setFilterEnabled().
   */
  static install(preferences: Map<string, SupplierPreference>): void {
    this.updateExclusions(preferences);

    if (this.installed) {
      Logger.info('ApiInterceptor: preferences updated.');
      return;
    }

    this.originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (
      ...args: Parameters<typeof fetch>
    ): Promise<Response> {
      const resolved = self.resolveInput(args[0], args[1]);

      // Phase 1: Transform REQUEST — only when filtering is enabled
      if (self.filterEnabled && resolved.url.includes(QUOTES_PATH)) {
        args = self.transformRequest(args, resolved);
      }

      // Execute original fetch
      const response = await self.originalFetch!.apply(this, args);

      // Phase 2: Capture RESPONSE — always active (awaited, not fire-and-forget)
      if (resolved.url.includes(QUOTES_PATH)) {
        try {
          const text = await response.clone().text();
          const data = JSON.parse(text) as Record<string, unknown>;
          Logger.info(
            `ApiInterceptor: captured carhire-quotes response (${Object.keys(data).join(', ')}).`,
          );
          SupplierRegistry.captureFromResponse(data);
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            // Expected during Skyscanner polling — skip silently
          } else {
            Logger.warn(`ApiInterceptor: response capture failed — ${String(err)}.`);
          }
        }
      }

      return response;
    };

    this.installed = true;
    Logger.info(
      `ApiInterceptor: fetch patched (capture=always, filtering=${this.filterEnabled}).`,
    );
  }

  /**
   * Restores the original fetch — cleanup for hot-reload or feature toggle.
   */
  static uninstall(): void {
    if (!this.installed || !this.originalFetch) return;

    window.fetch = this.originalFetch;
    this.originalFetch = null;
    this.installed = false;

    Logger.info('ApiInterceptor: fetch restored.');
  }

  /** Enables or disables request filtering (controlled by config.apiFilter). */
  static setFilterEnabled(enabled: boolean): void {
    this.filterEnabled = enabled;
    Logger.info(`ApiInterceptor: request filtering ${enabled ? 'enabled' : 'disabled'}.`);
  }

  /** Updates the exclusion set from the latest preferences. */
  static updateExclusions(preferences: Map<string, SupplierPreference>): void {
    const ids = new Set<string>();

    for (const [, pref] of preferences) {
      if (pref.excluded) {
        ids.add(pref.id);
      }
    }

    this.excludedVndrIds = ids;
  }

  /** Whether the interceptor is currently active. */
  static isActive(): boolean {
    return this.installed;
  }

  // ── Request Transformation ──────────────────────────────────────────────

  /**
   * Builds `filters=suppliers:...` from the SupplierRegistry.
   *
   * Strategy:
   *   - Registry empty  → pass through (cold start, will populate from response)
   *   - No exclusions   → pass through (nothing to filter)
   *   - Has exclusions  → build filters = registry IDs minus excluded IDs
   *
   * Returns a new args array; does not mutate the original.
   */
  private static transformRequest(
    args: Parameters<typeof fetch>,
    resolved: { url: string; isRequest: boolean },
  ): Parameters<typeof fetch> {
    const allIds = SupplierRegistry.getIds();
    if (allIds.length === 0) return args;

    const excluded = this.excludedVndrIds;
    if (excluded.size === 0) return args;

    const includedIds = allIds.filter((id) => !excluded.has(id));

    if (includedIds.length === 0) return args;

    try {
      const url = new URL(resolved.url);
      url.searchParams.set('filters', `${SUPPLIERS_FILTER_PREFIX}${includedIds.join(',')}`);

      Logger.info(
        `ApiInterceptor: filtered ${excluded.size} excluded vendor(s), passing ${includedIds.length} supplier(s).`,
      );

      // Rebuild args with modified URL
      if (resolved.isRequest && args[0] instanceof Request) {
        const original = args[0];
        const newRequest = new Request(url.href, original);
        return [newRequest, args[1]];
      }

      return [url.href, args[1]];
    } catch {
      Logger.warn('ApiInterceptor: failed to transform request URL, passing through.');
      return args;
    }
  }

  // ── Utility ─────────────────────────────────────────────────────────────

  /** Resolves URL and type info from fetch arguments. */
  private static resolveInput(
    input: RequestInfo | URL,
    _init?: RequestInit,
  ): { url: string; isRequest: boolean } {
    if (typeof input === 'string') return { url: input, isRequest: false };
    if (input instanceof URL) return { url: input.href, isRequest: false };
    if (input instanceof Request) return { url: input.url, isRequest: true };
    return { url: '', isRequest: false };
  }
}
