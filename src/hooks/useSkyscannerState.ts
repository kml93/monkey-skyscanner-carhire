/**
 * React hook that provides supplier data from the SupplierRegistry.
 *
 * Primary source: SupplierRegistry (captured from API responses, no DOM dependency).
 * Also reads total result count from the DOM banner text.
 */

import { useCallback, useEffect, useState } from 'react';

import { SupplierRegistry } from '@/core/SupplierRegistry';
import { SELECTORS } from '@/core/selectors';
import { TIMING } from '@/core/constants';
import type { Supplier } from '@/core/types';

function getSuppliersFromRegistry(): Supplier[] {
  const registryData = SupplierRegistry.getAll();
  return Array.from(registryData.values()).map((entry) => ({
    id: entry.id,
    name: entry.name,
    priceLabel: entry.minPrice !== null ? `from ${entry.minPrice} €` : '',
    price: entry.minPrice ?? 0,
    checked: true,
  }));
}

export function useSkyscannerState() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(getSuppliersFromRegistry);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  /**
   * Refreshes supplier data from SupplierRegistry.
   *
   * Uses requestIdleCallback to defer the refresh until the browser is idle,
   * preventing jank during initial page load or state transitions.
   */
  const refresh = useCallback(() => {
    setLoading(true);

    requestIdleCallback(() => {
      setSuppliers(getSuppliersFromRegistry());

      // Total results from banner (DOM-dependent, non-critical)
      const bannerText = document.querySelector(SELECTORS.banner.sortResults)?.textContent ?? '';
      const match = bannerText.match(/(\d+)\s*(result|résultat)/i);
      if (match) {
        setTotalResults(parseInt(match[1], 10));
      }

      setLoading(false);
    }, { timeout: TIMING.IDLE_REFRESH_TIMEOUT });
  }, []);

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
