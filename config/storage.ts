/**
 * Tampermonkey storage keys.
 */
export const storageConfig = {
  keys: {
    /** Record of supplier ID → SupplierEntry. */
    suppliers: 'skyscanner_suppliers',
    /** AutoConfig object. */
    autoConfig: 'skyscanner_auto_config',
    /** Theme preference. */
    theme: 'skyscanner_theme',
  },
} as const;
