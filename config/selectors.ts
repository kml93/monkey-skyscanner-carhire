/**
 * DOM selectors of the Skyscanner car hire results page.
 *
 * Every DOM lookup goes through this file: when Skyscanner changes its markup, only this file changes.
 * Strategy: prefer `data-testid` (stable) → `aria-*` (standard) → wildcard class (fragile).
 */
export const selectorsConfig = {
  sort: {
    /** Sort order <select>. */
    dropdown: '#sort-by-type',
    /** data-testid fallback for the sort <select>. */
    dropdownByTestId: '[data-testid="sort-by-type-select"]',
    /** Option values of the sort <select>. */
    values: {
      cheapest: 'CHEAPEST_SORT',
      recommended: 'RECOMMENDED_SORT',
    },
  },
  banner: {
    /** Banner showing the total result count. */
    sortResults: '[data-testid="sort-by-banner"]',
    /** Extracts the result count from the banner text (EN/FR). */
    resultCountPattern: /(\d+)\s*(result|résultat)/i,
  },
} as const;
