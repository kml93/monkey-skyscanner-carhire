/**
 * API Interceptor — patches the page's fetch (unsafeWindow) for supplier data capture and filtering.
 *
 * Two independent concerns:
 *   1. RESPONSE CAPTURE (always active when installed):
 *      Captures supplier data from carhire-quotes responses into SupplierRegistry.
 *      This populates the Dashboard with all available suppliers without DOM dependency.
 *
 *   2. REQUEST FILTERING (only when filterEnabled = true):
 *      Sets the `suppliers:...` segment of `filters` from SupplierRegistry (included entries only),
 *      keeping Skyscanner's own segments (price, transmissions, ...). Controlled by config.apiFilter.
 *
 * Single Responsibility: only handles fetch interception and URL transformation.
 */

import { unsafeWindow } from '$';
import { API_CONSTANTS } from './constants';
import { Logger } from './Logger';
import { SupplierRegistry } from './SupplierRegistry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PriceRange {
  min: number | null;
}

interface SupplierOption {
  id: string | number;
  display_text: string;
  price_range?: PriceRange;
}

interface SupplierFilter {
  filter_type: string;
  string_value_filter?: {
    options?: SupplierOption[];
  };
}

interface SkyscannerApiResponse {
  filters?: SupplierFilter[];
}

// ---------------------------------------------------------------------------
// API Interceptor
// ---------------------------------------------------------------------------

export class ApiInterceptor {
  private static originalFetch: typeof window.fetch | null = null;
  private static installed = false;

  /** Whether request filtering is active (config.apiFilter). */
  private static filterEnabled = false;

  /** Whether a carhire-quotes request has gone through the interceptor since install. */
  private static quotesIntercepted = false;

  /** Startup watcher for requests that bypassed the interceptor (see watchMissedRequests). */
  private static missedRequestObserver: PerformanceObserver | null = null;

  // ── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Installs the fetch interceptor.
   * Idempotent — safe to call multiple times.
   *
   * Always captures responses. Request filtering is controlled by setFilterEnabled().
   * Uses SupplierRegistry directly for exclusion data.
   */
  static install(): void {
    if (this.installed) {
      return;
    }

    this.originalFetch = unsafeWindow.fetch;

    unsafeWindow.fetch = async function (
      ...args: Parameters<typeof fetch>
    ): Promise<Response> {
      const resolved = ApiInterceptor.resolveInput(args[0]);
      if (resolved.url.includes(API_CONSTANTS.QUOTES_PATH)) {
        ApiInterceptor.quotesIntercepted = true;
      }

      // Phase 1: Transform REQUEST — only when filtering is enabled
      if (ApiInterceptor.filterEnabled && resolved.url.includes(API_CONSTANTS.QUOTES_PATH)) {
        args = ApiInterceptor.transformRequest(args, resolved);
      }

      // Execute original fetch
      const response = await ApiInterceptor.originalFetch!.apply(this, args);

      // Phase 2: Capture RESPONSE — always active (awaited, not fire-and-forget)
      if (!resolved.url.includes(API_CONSTANTS.QUOTES_PATH)) {
        return response;
      }

      try {
        const text = await response.clone().text();
        const data = JSON.parse(text) as SkyscannerApiResponse;
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
    this.missedRequestObserver?.disconnect();
    this.missedRequestObserver = null;

    if (!this.installed || !this.originalFetch) return;

    unsafeWindow.fetch = this.originalFetch;
    this.originalFetch = null;
    this.installed = false;
    this.quotesIntercepted = false;

    Logger.info('ApiInterceptor: fetch restored.');
  }

  /**
   * Startup catch-up: calls `onMissed` once if a carhire-quotes request reached the
   * network before any quotes request went through the interceptor — the results
   * on screen are then unfiltered. Happens in dev (Vite serves the script after the
   * page's first request) or whenever the page beats the userscript.
   *
   * Event-driven: the browser reports finished requests (PerformanceObserver,
   * `buffered` replays those finished before the call). No timers.
   * Stops at the first verdict: missed request, or a quotes request intercepted.
   */
  static watchMissedRequests(onMissed: () => void): void {
    this.missedRequestObserver?.disconnect();

    const observer = new PerformanceObserver((list) => {
      if (this.quotesIntercepted) {
        observer.disconnect();
        return;
      }
      if (!list.getEntries().some((entry) => entry.name.includes(API_CONSTANTS.QUOTES_PATH))) return;

      observer.disconnect();
      if (!this.filterEnabled) return;

      Logger.info('ApiInterceptor: a carhire-quotes request bypassed the interceptor — re-fetching.');
      onMissed();
    });

    observer.observe({ type: 'resource', buffered: true });
    this.missedRequestObserver = observer;
  }

  /** Enables or disables request filtering (controlled by config.apiFilter). */
  static setFilterEnabled(enabled: boolean): void {
    this.filterEnabled = enabled;
    Logger.info(`ApiInterceptor: request filtering ${enabled ? 'enabled' : 'disabled'}.`);
  }

  /** Whether the interceptor is currently active. */
  static isActive(): boolean {
    return this.installed;
  }

  // ── Request Transformation ──────────────────────────────────────────────

  /**
   * Sets the `suppliers:...` segment of `filters` from the SupplierRegistry,
   * keeping the other segments built by Skyscanner (`price:…|transmissions:…`).
   *
   * Strategy:
   *   - Registry empty  → pass through (cold start, will populate from response)
   *   - No exclusions   → pass through (nothing to filter)
   *   - Has exclusions  → build filters = included IDs from registry
   *
   * Returns a new args array; does not mutate the original.
   */
  private static transformRequest(
    args: Parameters<typeof fetch>,
    resolved: { url: string; isRequest: boolean },
  ): Parameters<typeof fetch> {
    const includedIds = SupplierRegistry.getIncludedIds();
    if (includedIds.length === 0) return args;

    try {
      const url = new URL(resolved.url);
      url.searchParams.set('filters', this.buildFilters(url.searchParams.get('filters'), includedIds));
      url.searchParams.set('sort_type', API_CONSTANTS.SORT_TYPE_CHEAPEST);

      Logger.info(
        `ApiInterceptor: passing ${includedIds.length} included supplier(s), sort=${API_CONSTANTS.SORT_TYPE_CHEAPEST}.`,
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

  /**
   * Replaces the `suppliers:` segment of a `filters` value with the included IDs,
   * keeping every other segment built by Skyscanner (`price:…|transmissions:…`).
   */
  private static buildFilters(pageFilters: string | null, includedIds: string[]): string {
    const suppliersSegment = `${API_CONSTANTS.SUPPLIERS_FILTER_PREFIX}${includedIds.join(',')}`;
    if (!pageFilters) return suppliersSegment;

    const pageSegments = pageFilters
      .split(API_CONSTANTS.FILTERS_SEPARATOR)
      .filter((segment) => segment !== '' && !segment.startsWith(API_CONSTANTS.SUPPLIERS_FILTER_PREFIX));

    return [...pageSegments, suppliersSegment].join(API_CONSTANTS.FILTERS_SEPARATOR);
  }

  // ── Utility ─────────────────────────────────────────────────────────────

  /** Resolves URL and type info from fetch arguments. */
  private static resolveInput(input: RequestInfo | URL): { url: string; isRequest: boolean } {
    if (typeof input === 'string') return { url: input, isRequest: false };
    if (input instanceof URL) return { url: input.href, isRequest: false };
    if (input instanceof Request) return { url: input.url, isRequest: true };
    return { url: '', isRequest: false };
  }
}
