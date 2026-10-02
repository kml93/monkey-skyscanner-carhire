import { apiConfig } from '@config/api';

import type { ResultsRefresher } from '@app/Results/ResultsRefresher';
import type { Logger } from '@app/Support/Logger';
import type { FetchInterceptor } from './FetchInterceptor';

/**
 * Startup catch-up: re-fetches once if a carhire-quotes request reached the network
 * before any quotes request went through the FetchInterceptor — the results on screen
 * are then unfiltered. Happens in dev (Vite serves the script after the page's first
 * request) or whenever the page beats the userscript.
 *
 * Event-driven: the browser reports finished requests (PerformanceObserver; `buffered`
 * replays those finished before the call). Stops at the first verdict: a missed
 * request, or an intercepted one.
 */
export class MissedRequestWatcher {
  private readonly interceptor: FetchInterceptor;
  private readonly refresher: ResultsRefresher;
  private readonly logger: Logger;
  private observer: PerformanceObserver | null = null;

  constructor(interceptor: FetchInterceptor, refresher: ResultsRefresher, logger: Logger) {
    this.interceptor = interceptor;
    this.refresher = refresher;
    this.logger = logger;
  }

  watch(): void {
    this.stop();
    this.observer = new PerformanceObserver((list) => this.inspect(list.getEntries()));
    this.observer.observe({ type: 'resource', buffered: true });
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private inspect(entries: PerformanceEntryList): void {
    if (this.interceptor.hasInterceptedQuotes()) {
      this.stop();
      return;
    }
    if (!entries.some((entry) => entry.name.includes(apiConfig.quotesPath))) return;

    this.stop();
    if (!this.interceptor.isFilterEnabled()) return;

    this.logger.info('MissedRequestWatcher: a carhire-quotes request bypassed the interceptor — re-fetching.');
    this.refresher.refetchWhenReady();
  }
}
