/**
 * React hook that provides supplier data from the SupplierRegistry.
 *
 * Primary source: SupplierRegistry (captured from API responses, no DOM dependency).
 * Fallback: DOM scraping via FilterEngine.scrapeSuppliers() (cold start only).
 *
 * Also reads total result count from the DOM banner text.
 */

import { useCallback, useEffect, useState } from 'react';

import { FilterEngine } from '@/core/FilterEngine';
import { SupplierRegistry } from '@/core/SupplierRegistry';
import type { Supplier } from '@/core/types';

export function useSkyscannerState() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  /**
   * Refreshes supplier data.
   * Uses SupplierRegistry as primary source, falls back to DOM scraping.
   *
   * Uses requestIdleCallback to defer the refresh until the browser is idle,
   * preventing jank during initial page load or state transitions.
   */
  const refresh = useCallback(() => {
    setLoading(true);

    requestIdleCallback(() => {
      // Primary: registry data (always available, no DOM dependency)
      const registryData = SupplierRegistry.getAll();

      if (registryData.size > 0) {
        const mapped: Supplier[] = Array.from(registryData.values()).map((info) => ({
          id: info.id,
          name: info.name,
          priceLabel: info.minPrice !== null ? `from ${info.minPrice} €` : '',
          price: info.minPrice ?? 0,
          checked: true,
        }));
        setSuppliers(mapped);
      } else {
        // Fallback: DOM scraping (cold start before first API response)
        const scraped = FilterEngine.scrapeSuppliers();
        setSuppliers(scraped);
      }

      // Total results from banner (DOM-dependent, non-critical)
      const bannerText = document.querySelector('[data-testid="sort-by-banner"]')?.textContent ?? '';
      const match = bannerText.match(/(\d+)\s*(result|résultat)/i);
      if (match) {
        setTotalResults(parseInt(match[1], 10));
      }

      setLoading(false);
    }, { timeout: 2000 });
  }, []);

  // Initial scrape on mount
  useEffect(() => {
    // Delay to ensure UIBootController has completed
    const timer = setTimeout(refresh, 2_000);
    return () => clearTimeout(timer);
  }, [refresh]);

  // Auto-refresh when registry captures new data from API responses
  useEffect(() => {
    return SupplierRegistry.onChange(refresh);
  }, [refresh]);

  return {
    suppliers,
    totalResults,
    loading,
    refresh,
  };
}
