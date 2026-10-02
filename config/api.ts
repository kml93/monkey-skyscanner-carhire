/**
 * Contracts of Skyscanner's carhire-quotes API.
 */
export const apiConfig = {
  /** URL substring identifying carhire-quotes requests. */
  quotesPath: '/g/carhire-quotes/',
  /** Query parameter holding the filter segments (`price:…|suppliers:…`). */
  filtersParam: 'filters',
  /** Separator between filter segments. */
  filtersSeparator: '|',
  /** Prefix of the supplier filter segment. */
  suppliersFilterPrefix: 'suppliers:',
  /** `filter_type` of the response filter listing the suppliers. */
  suppliersFilterType: 'filter_type_suppliers',
  /** Query parameter holding the sort order. */
  sortTypeParam: 'sort_type',
  /** Sort value. The API accepts `cheapest | -cheapest | recommended | -recommended | distance`. */
  sortTypeCheapest: 'cheapest',
} as const;
