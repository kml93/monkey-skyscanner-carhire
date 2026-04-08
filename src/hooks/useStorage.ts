/**
 * React hook wrapping StorageService for reactive state management.
 *
 * Provides typed getters/setters for all persisted data with
 * automatic re-render on cross-tab synchronization updates.
 */

import { useCallback, useEffect, useState } from 'react';

import { StorageService } from '@/core/StorageService';
import { type AutoConfig, DEFAULT_AUTO_CONFIG, type SupplierPreference } from '@/core/types';

// ---------------------------------------------------------------------------
// useExcludedSuppliers
// ---------------------------------------------------------------------------

export function useExcludedSuppliers() {
  const [preferences, setPreferences] = useState<Map<string, SupplierPreference>>(
    () => StorageService.getExcludedSuppliers(),
  );

  // Cross-tab sync
  useEffect(() => {
    const listenerId = StorageService.onSuppliersChanged((newPrefs, remote) => {
      if (remote) setPreferences(newPrefs);
    });

    return () => StorageService.unsubscribe(listenerId);
  }, []);

  const updatePreferences = useCallback(
    (updater: (prev: Map<string, SupplierPreference>) => Map<string, SupplierPreference>) => {
      setPreferences((prev) => {
        const next = updater(new Map(prev));
        StorageService.setExcludedSuppliers(next);
        return next;
      });
    },
    [],
  );

  const toggleSupplier = useCallback(
    (id: string, name: string) => {
      updatePreferences((prev) => {
        const existing = prev.get(id);
        prev.set(id, {
          id,
          name,
          excluded: !(existing?.excluded ?? false),
        });
        return prev;
      });
    },
    [updatePreferences],
  );

  const excludeAll = useCallback(
    (suppliers: Array<{ id: string; name: string }>) => {
      updatePreferences((prev) => {
        for (const s of suppliers) {
          prev.set(s.id, { id: s.id, name: s.name, excluded: true });
        }
        return prev;
      });
    },
    [updatePreferences],
  );

  const includeAll = useCallback(
    () => {
      updatePreferences((prev) => {
        for (const [, pref] of prev) {
          pref.excluded = false;
        }
        return prev;
      });
    },
    [updatePreferences],
  );

  const excludedCount = Array.from(preferences.values()).filter((p) => p.excluded).length;

  return {
    preferences,
    toggleSupplier,
    excludeAll,
    includeAll,
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

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_AUTO_CONFIG);
    StorageService.setAutoConfig(DEFAULT_AUTO_CONFIG);
  }, []);

  return { config, updateConfig, resetConfig };
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
