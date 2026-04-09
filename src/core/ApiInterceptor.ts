/**
 * API Interceptor — patches window.fetch to filter carhire-quotes requests.
 *
 * Modifies the outgoing request URL to exclude unwanted suppliers from the
 * `filters=suppliers:...` query parameter. The server returns only matching
 * results, keeping pagination intact (no response-body tampering).
 *
 * - Zero DOM interaction (no checkbox clicks)
 * - Zero isTrusted=false events (undetectable by anti-bot)
 * - Zero forced reflows (no performance violations)
 * - Pagination-safe (server-side filtering)
 *
 * Single Responsibility: only handles request URL transformation.
 */

import { Logger } from './Logger';
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

  /** Set of excluded vendor IDs (numeric string → true). */
  private static excludedVndrIds: Set<string> = new Set();

  // ── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Installs the fetch interceptor.
   * Idempotent — safe to call multiple times (updates preferences only).
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

      if (resolved.url.includes(QUOTES_PATH)) {
        args = self.transformRequest(args, resolved);
      }

      return self.originalFetch!.apply(this, args);
    };

    this.installed = true;
    Logger.info('ApiInterceptor: fetch patched (request-level filtering).');
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
   * Rewrites the fetch arguments to remove excluded suppliers from
   * the `filters=suppliers:...` query parameter.
   *
   * Returns a new args array; does not mutate the original.
   */
  private static transformRequest(
    args: Parameters<typeof fetch>,
    resolved: { url: string; isRequest: boolean },
  ): Parameters<typeof fetch> {
    const excluded = this.excludedVndrIds;

    if (excluded.size === 0) return args;

    try {
      const url = new URL(resolved.url);
      const filtersParam = url.searchParams.get('filters');

      if (!filtersParam || !filtersParam.startsWith(SUPPLIERS_FILTER_PREFIX)) {
        return args;
      }

      const supplierIds = filtersParam
        .substring(SUPPLIERS_FILTER_PREFIX.length)
        .split(',');

      const filteredIds = supplierIds.filter((id) => !excluded.has(id));
      const removedCount = supplierIds.length - filteredIds.length;

      if (removedCount === 0) return args;

      url.searchParams.set('filters', `${SUPPLIERS_FILTER_PREFIX}${filteredIds.join(',')}`);

      Logger.info(
        `ApiInterceptor: removed ${removedCount} excluded vendor(s) from request filters.`,
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
