import { apiConfig } from '@config/api';

import type { SupplierRepository } from '@app/Suppliers/SupplierRepository';
import type { Logger } from '@app/Support/Logger';
import type { QuotesResponse } from './Data/QuotesResponse';
import type { QuotesRequestRewriter } from './QuotesRequestRewriter';
import type { QuotesResponseParser } from './QuotesResponseParser';

type FetchArgs = Parameters<typeof fetch>;

/**
 * Patches the page's fetch for carhire-quotes requests:
 *   - request: rewritten by QuotesRequestRewriter while filtering is enabled;
 *   - response: always parsed and merged into the SupplierRepository.
 * Other requests pass through untouched.
 */
export class FetchInterceptor {
  private readonly target: Window;
  private readonly rewriter: QuotesRequestRewriter;
  private readonly parser: QuotesResponseParser;
  private readonly suppliers: SupplierRepository;
  private readonly logger: Logger;
  private originalFetch: typeof fetch | null = null;
  private filterEnabled = false;
  private quotesIntercepted = false;

  constructor(
    target: Window,
    rewriter: QuotesRequestRewriter,
    parser: QuotesResponseParser,
    suppliers: SupplierRepository,
    logger: Logger,
  ) {
    this.target = target;
    this.rewriter = rewriter;
    this.parser = parser;
    this.suppliers = suppliers;
    this.logger = logger;
  }

  /** Idempotent. */
  install(): void {
    if (this.originalFetch) return;

    const originalFetch = this.target.fetch;
    const handle = (thisArg: unknown, args: FetchArgs): Promise<Response> => this.handle(originalFetch, thisArg, args);
    this.originalFetch = originalFetch;
    this.target.fetch = function (this: unknown, ...args: FetchArgs): Promise<Response> {
      return handle(this, args);
    };

    this.logger.info(`FetchInterceptor: fetch patched (capture=always, filtering=${this.filterEnabled}).`);
  }

  uninstall(): void {
    if (!this.originalFetch) return;

    this.target.fetch = this.originalFetch;
    this.originalFetch = null;
    this.quotesIntercepted = false;
    this.logger.info('FetchInterceptor: fetch restored.');
  }

  setFilterEnabled(enabled: boolean): void {
    if (this.filterEnabled === enabled) return;

    this.filterEnabled = enabled;
    this.logger.info(`FetchInterceptor: request filtering=${enabled}.`);
  }

  isFilterEnabled(): boolean {
    return this.filterEnabled;
  }

  /** Whether a carhire-quotes request went through the interceptor since install. */
  hasInterceptedQuotes(): boolean {
    return this.quotesIntercepted;
  }

  private async handle(originalFetch: typeof fetch, thisArg: unknown, args: FetchArgs): Promise<Response> {
    const url = this.urlOf(args[0]);
    if (!url.includes(apiConfig.quotesPath)) return originalFetch.apply(thisArg, args);

    this.quotesIntercepted = true;
    const response = await originalFetch.apply(thisArg, this.filteredArgs(args, url));
    await this.capture(response);

    return response;
  }

  private filteredArgs(args: FetchArgs, url: string): FetchArgs {
    if (!this.filterEnabled) return args;

    const [input, init] = args;
    const href = this.rewriter.rewrite(url);
    if (href === null) return args;
    if (input instanceof Request) return [new Request(href, input), init];

    return [href, init];
  }

  /** Awaited before the page reads the response, so the repository is up to date first. */
  private async capture(response: Response): Promise<void> {
    try {
      const data = JSON.parse(await response.clone().text()) as QuotesResponse | null;
      this.logger.info('FetchInterceptor: captured carhire-quotes response.');
      this.suppliers.merge(this.parser.parse(data));
    } catch (error) {
      // Aborted requests are expected during Skyscanner polling.
      if (error instanceof DOMException && error.name === 'AbortError') return;

      this.logger.warn(`FetchInterceptor: response capture failed — ${String(error)}.`);
    }
  }

  private urlOf(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;

    return input.url;
  }
}
