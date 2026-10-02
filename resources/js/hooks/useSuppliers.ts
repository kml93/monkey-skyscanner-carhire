import { useCallback, useEffect, useState } from 'react';

import type { SupplierMap } from '@app/Suppliers/Data/SupplierMap';
import { SupplierRepository } from '@app/Suppliers/SupplierRepository';
import { useService } from './useService';

/** Live supplier map: re-renders on captures, commits and writes from other tabs. */
export function useSuppliers() {
  const repository = useService(SupplierRepository);
  const [suppliers, setSuppliers] = useState<SupplierMap>(() => repository.all());

  useEffect(() => repository.onChange(setSuppliers), [repository]);

  const commitSuppliers = useCallback((next: SupplierMap) => repository.replace(next), [repository]);
  const excludedCount = Array.from(suppliers.values()).filter((entry) => entry.status === 'excluded').length;

  return { suppliers, commitSuppliers, excludedCount };
}
