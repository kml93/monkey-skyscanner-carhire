import { apiConfig } from '@config/api';

import type { SupplierRepository } from '@app/Suppliers/SupplierRepository';
import type { Logger } from '@app/Support/Logger';

/**
 * Rewrites a carhire-quotes URL so the API only returns included suppliers, sorted by price.
 */
export class QuotesRequestRewriter {
  private readonly suppliers: SupplierRepository;
  private readonly logger: Logger;

  constructor(suppliers: SupplierRepository, logger: Logger) {
    this.suppliers = suppliers;
    this.logger = logger;
  }

  /**
   * Returns the rewritten URL, or null to send the request unchanged:
   * no known supplier yet (cold start, the response will populate them) or an unparsable URL.
   */
  rewrite(href: string): string | null {
    const includedIds = this.suppliers.includedIds();
    if (includedIds.length === 0) return null;

    try {
      const url = new URL(href);
      url.searchParams.set(apiConfig.filtersParam, this.buildFilters(url.searchParams.get(apiConfig.filtersParam), includedIds));
      url.searchParams.set(apiConfig.sortTypeParam, apiConfig.sortTypeCheapest);
      this.logger.info(`QuotesRequestRewriter: passing ${includedIds.length} included supplier(s), sort=${apiConfig.sortTypeCheapest}.`);

      return url.href;
    } catch {
      this.logger.warn('QuotesRequestRewriter: failed to parse the request URL, passing through.');
      return null;
    }
  }

  /**
   * Replaces the `suppliers:` segment of a `filters` value with the included IDs,
   * keeping every other segment built by Skyscanner (`price:…|transmissions:…`).
   */
  private buildFilters(pageFilters: string | null, includedIds: string[]): string {
    const suppliersSegment = `${apiConfig.suppliersFilterPrefix}${includedIds.join(',')}`;
    if (!pageFilters) return suppliersSegment;

    return pageFilters
      .split(apiConfig.filtersSeparator)
      .filter((segment) => segment !== '' && !segment.startsWith(apiConfig.suppliersFilterPrefix))
      .concat(suppliersSegment)
      .join(apiConfig.filtersSeparator);
  }
}
