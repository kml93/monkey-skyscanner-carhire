/**
 * React hook wrapping StorageService for reactive state management.
 *
 * Provides typed getters/setters for all persisted data with
 * automatic re-render on cross-tab synchronization updates.
 */

import { useCallback, useEffect, useState } from 'react';

import { StorageService } from '@/core/StorageService';
import { type AutoConfig, DEFAULT_AUTO_CONFIG, type SupplierEntry } from '@/core/types';

// ---------------------------------------------------------------------------
// useSuppliers
// ---------------------------------------------------------------------------

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Map<string, SupplierEntry>>(
    () => StorageService.getSuppliers(),
  );

  // Cross-tab sync
  useEffect(() => {
    const listenerId = StorageService.onSuppliersChanged((newSuppliers, remote) => {
      if (remote) setSuppliers(newSuppliers);
    });

    return () => StorageService.unsubscribe(listenerId);
  }, []);

  const commitSuppliers = useCallback(
    (newSuppliers: Map<string, SupplierEntry>) => {
      setSuppliers(newSuppliers);
      StorageService.setSuppliers(newSuppliers);
    },
    [],
  );

  const excludedCount = Array.from(suppliers.values()).filter((s) => s.status === 'excluded').length;

  return {
    suppliers,
    commitSuppliers,
    excludedCount,
  };
}

// ---------------------------------------------------------------------------
// useAutoConfig
// ---------------------------------------------------------------------------

export function useAutoConfig() {
  const [config, setConfig] = useState<AutoConfig>(
    () => StorageService.getAutoConfig(),
  );

  // Cross-tab sync
  useEffect(() => {
    const listenerId = StorageService.onAutoConfigChanged((newConfig, remote) => {
      if (remote) setConfig(newConfig);
    });

    return () => StorageService.unsubscribe(listenerId);
  }, []);

  const updateConfig = useCallback(
    (partial: Partial<AutoConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...partial };
        StorageService.setAutoConfig(next);
        return next;
      });
    },
    [],
  );

  const commitConfig = useCallback((fullConfig: AutoConfig) => {
    setConfig(fullConfig);
    StorageService.setAutoConfig(fullConfig);
  }, []);

  const resetConfig = useCallback(() => {
    commitConfig(DEFAULT_AUTO_CONFIG);
  }, [commitConfig]);

  return { config, updateConfig, resetConfig, commitConfig };
}

// ---------------------------------------------------------------------------
// useTheme
// ---------------------------------------------------------------------------

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    () => StorageService.getTheme(),
  );

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t);
    StorageService.setTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      StorageService.setTheme(next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggleTheme };
}
