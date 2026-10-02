import { apiConfig } from '@config/api';

import type { SupplierDetails } from '@app/Suppliers/Data/SupplierDetails';
import type { QuotesFilterOption } from './Data/QuotesFilterOption';
import type { QuotesResponse } from './Data/QuotesResponse';

/**
 * Validates a carhire-quotes response and extracts its supplier list from
 * `filters[filter_type_suppliers].string_value_filter.options`.
 * Any unexpected shape yields an empty list.
 */
export class QuotesResponseParser {
  parse(response: QuotesResponse | null): SupplierDetails[] {
    const filters = response?.filters;
    if (!Array.isArray(filters)) return [];

    const options = filters.find((filter) => filter.filter_type === apiConfig.suppliersFilterType)
      ?.string_value_filter?.options;
    if (!Array.isArray(options)) return [];

    return options.map((option) => ({
      id: String(option.id),
      name: String(option.display_text ?? ''),
      minPrice: this.minPrice(option),
    }));
  }

  private minPrice(option: QuotesFilterOption): number | null {
    const min = option.price_range?.min;
    return min == null ? null : Number(min);
  }
}
