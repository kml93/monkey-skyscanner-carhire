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

  // ── Sidebar Container ─────────────────────────────────────────────────
  sidebar: {
    /** Main sidebar wrapper holding all filter sections */
    container: '[data-testid="side-container-filters-container"]',
    /** Inner container grouping accordion filter sections */
    filtersContainer: '[data-testid="accordion-filters-container"]',
  },

  // ── Accordion Sections ─────────────────────────────────────────────────
  accordion: {
    /** Toggle button for each filter section (generic, aria-based) */
    toggleButton: 'button[aria-expanded]',
    /** Wildcard class selector — survives hash suffix rotation */
    toggleButtonWildcard: 'button[class*="accordion__toggle-button"]',
  },

  // ── Supplier / Prestataire Filter ──────────────────────────────────────
  supplier: {
    /** Checkbox input for a specific supplier by its numeric ID */
    checkbox: (id: string) => `[data-testid="supplier-${id}-checkbox"]`,
    /** Wrapper container for a specific supplier entry */
    container: (id: string) => `[data-testid="supplier-${id}-checkbox-container"]`,
    /** Display name element for a specific supplier */
    name: (id: string) => `[data-testid="supplier-${id}-name"]`,
    /** Price label element for a specific supplier */
    price: (id: string) => `[data-testid="supplier-${id}-price"]`,
    /** Wildcard selector matching any supplier checkbox input */
    anyCheckbox: '[data-testid^="supplier-"][data-testid$="-checkbox"]:not([data-testid$="-checkbox-container"])',
    /** Wildcard selector matching any supplier container */
    anyContainer: '[data-testid^="supplier-"][data-testid$="-checkbox-container"]',
    /** Checkbox input class (Backpack design system) */
    checkboxInputWildcard: 'input[class*="bpk-checkbox__input"]',
  },

  // ── Action Buttons (Prestataire section) ───────────────────────────────
  buttons: {
    /** "Afficher tous les fournisseurs" — expand full supplier list */
    showAllSuppliers: '[data-testid="show-all-suppliers"]',
    /** "Tout sélectionner" / "Tout supprimer" — filter action buttons (wildcard) */
    filterActionWildcard: 'button[class*="filter-button"]',
    /** Provider name label in result cards */
    providerName: '[data-testid="provider-name"]',
  },

  // ── Sort Values ────────────────────────────────────────────────────────
  sortValues: {
    /** Sort by cheapest price */
    cheapest: 'CHEAPEST_SORT',
    /** Sort by recommended (default) */
    recommended: 'RECOMMENDED_SORT',
  },

  // ── Loaders ────────────────────────────────────────────────────────────
  loaders: {
    /** Top loading bar indicating search progress */
    progressBar: '#results-loading-bar',
    /** Overlay panel spinner "Recherche en cours" */
    spinnerPanel: '[class*="ResultsView_ResultsView__infoPanel"]',
    /** Internal spinner container within the panel */
    spinnerContainer: '[class*="ResultsView_ResultsView__spinnerContainer"]',
  },

  // ── Accordion Section Labels (Support both FR and EN) ──────────────────
  accordionLabels: {
    /** The supplier section label */
    provider: ['Prestataire', 'Provider'],
    /** Footer accordion labels — not part of filters, should be ignored */
    footerSections: ['Explorer', 'Explore', 'Entreprise', 'Company', 'Partenaires', 'Partners', 'Voyages', 'Trips', 'Sites internationaux', 'International sites'],
  },
} as const;
