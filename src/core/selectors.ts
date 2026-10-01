/**
 * Centralized DOM selector registry for Skyscanner car hire results page.
 *
 * Every DOM interaction goes through this registry.
 * If Skyscanner changes its obfuscated CSS classes, only this file needs updating.
 *
 * Strategy: prefer `data-testid` (stable) → `aria-*` (standard) → wildcard class (fragile).
 * Wildcard selectors (`*=`) are used to survive hash suffix changes in CSS modules.
 */

export const SELECTORS = {

  // ── Sort Controls ──────────────────────────────────────────────────────
  sort: {
    /** <select> dropdown for sort order */
    dropdown: '#sort-by-type',
    /** data-testid fallback for the sort dropdown */
    dropdownByTestId: '[data-testid="sort-by-type-select"]',
  },


  // ── Sort Values ────────────────────────────────────────────────────────
  sortValues: {
    /** Sort by cheapest price */
    cheapest: 'CHEAPEST_SORT',
    /** Sort by recommended (default) */
    recommended: 'RECOMMENDED_SORT',
  },

  // ── Banner ──────────────────────────────────────────────────────────────
  banner: {
    /** Sort results banner showing total count */
    sortResults: '[data-testid="sort-by-banner"]',
  },

} as const;
