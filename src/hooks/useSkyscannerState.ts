/**
 * React hook that scrapes the current Skyscanner DOM state.
 *
 * Provides a reactive view of visible suppliers,
 * refreshed on demand or triggered by the DomObserver.
 */

import { useCallback, useEffect, useState } from 'react';

import { FilterEngine } from '@/core/FilterEngine';
import type { Supplier } from '@/core/types';

export function useSkyscannerState() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  /**
   * Scrapes the DOM for current supplier data.
   * Called on mount and can be triggered manually via `refresh()`.
   */
  const refresh = useCallback(() => {
    setLoading(true);

    // Use requestAnimationFrame to ensure we read the latest DOM state
    requestAnimationFrame(() => {
      const scraped = FilterEngine.scrapeSuppliers();
      setSuppliers(scraped);

      // Try to read total result count from the banner text
      const bannerText = document.querySelector('[data-testid="sort-by-banner"]')?.textContent ?? '';
      const match = bannerText.match(/(\d+)\s*résultat/);
      if (match) {
        setTotalResults(parseInt(match[1], 10));
      }

      setLoading(false);
    });
  }, []);

  // Initial scrape on mount
  useEffect(() => {
    // Delay to ensure UIBootController has completed
    const timer = setTimeout(refresh, 2_000);
    return () => clearTimeout(timer);
  }, [refresh]);

  return {
    suppliers,
    totalResults,
    loading,
    refresh,
  };
}
