import { useCallback, useEffect, useState } from 'react';

import { timingConfig } from '@config/timing';

import { ResultCountReader } from '@app/Results/ResultCountReader';
import { SupplierRepository } from '@app/Suppliers/SupplierRepository';
import { useService } from './useService';

/**
 * Total result count read from Skyscanner's banner.
 * Re-read when the browser is idle (no jank during page load), on demand and after each supplier change.
 */
export function useResultCount() {
  const reader = useService(ResultCountReader);
  const suppliers = useService(SupplierRepository);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    requestIdleCallback(() => {
      const count = reader.read();
      if (count !== null) setTotalResults(count);
      setLoading(false);
    }, { timeout: timingConfig.idleRefreshTimeout });
  }, [reader]);

  useEffect(() => suppliers.onChange(refresh), [suppliers, refresh]);

  return { totalResults, loading, refresh };
}
