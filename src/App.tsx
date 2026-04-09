/**
 * Root Application Component — the orchestrator.
 *
 * Manages global state flow:
 * FloatingIndicator → FloatingMenu → Dashboard Modal
 *
 * Initializes core services (ScrollInterceptor, UIBootController, DomObserver)
 * and coordinates between UI components and the filter engine.
 */

import { useCallback, useEffect, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ApiInterceptor } from '@/core/ApiInterceptor';
import { DomObserver } from '@/core/DomObserver';
import { FilterEngine } from '@/core/FilterEngine';
import { ScrollInterceptor } from '@/core/ScrollInterceptor';
import { SupplierRegistry } from '@/core/SupplierRegistry';
import { UIBootController } from '@/core/UIBootController';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { FloatingIndicator } from '@/features/floating-indicator/FloatingIndicator';
import { FloatingMenu } from '@/features/floating-indicator/FloatingMenu';
import { type AutoConfig, type SupplierPreference } from '@/core/types';
import { useAutoConfig, useExcludedSuppliers, useTheme } from '@/hooks/useStorage';
import { useSkyscannerState } from '@/hooks/useSkyscannerState';

const App = ({ shadowHost }: { shadowHost: HTMLElement | null }) => {
  // ── State ────────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('suppliers');

  // ── Hooks ────────────────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();
  const { config, commitConfig } = useAutoConfig();
  const { preferences, commitPreferences, excludedCount } = useExcludedSuppliers();
  const { suppliers, totalResults, loading: loadingSuppliers, refresh: refreshSuppliers } = useSkyscannerState();

  // ── Boot Sequence ────────────────────────────────────────────────────
  useEffect(() => {
    shadowHost?.classList.toggle('dark', theme === 'dark');
  }, [theme, shadowHost]);

  useEffect(() => {
    void (config.scrollLock ? ScrollInterceptor.enable() : ScrollInterceptor.disable());
  }, [config.scrollLock]);

  // Sync API interceptor: always installed for response capture,
  // request filtering toggled by config.apiFilter
  useEffect(() => {
    ApiInterceptor.setFilterEnabled(config.apiFilter);
    ApiInterceptor.install(preferences);
  }, [config.apiFilter, preferences]);

  useEffect(() => {
    // Initialize supplier registry from persisted storage
    SupplierRegistry.initialize();

    // Run boot sequence with new callback logic
    UIBootController.boot(config, () => {
      if (config.autoApply) {
        FilterEngine.apply(preferences);
      }
      refreshSuppliers();
    });

    // Watch for SPA navigation (URL changes) and re-boot
    DomObserver.start();
    const unsub = DomObserver.onNavigate(() => {
      // Always ensure interceptor is installed for response capture
      ApiInterceptor.install(preferences);

      UIBootController.reset();
      UIBootController.boot(config, () => {
        // DOM-based fallback: still apply if autoApply is on
        // and stealth filter is not handling it
        if (config.autoApply && !config.apiFilter) {
          FilterEngine.apply(preferences);
        }
        refreshSuppliers();
      });
    });

    return () => {
      unsub();
      DomObserver.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleIndicatorClick = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleOpenDashboard = useCallback(
    (tab: string = 'suppliers') => {
      setDashboardTab(tab);
      setDashboardOpen(true);
      // Refresh supplier data when opening dashboard
      refreshSuppliers();
    },
    [refreshSuppliers],
  );

  const handleCloseDashboard = useCallback(() => {
    setDashboardOpen(false);
  }, []);

  const handleCommit = useCallback(
    (newConfig: AutoConfig, newPreferences: Map<string, SupplierPreference>) => {
      commitConfig(newConfig);
      commitPreferences(newPreferences);
    },
    [commitConfig, commitPreferences],
  );

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <TooltipProvider delay={300}>
      {/* <div className={cn('min-h-full font-mono antialiased text-foreground bg-background', theme === 'dark' ? 'dark' : '')}> */}
      {/* Floating Indicator (always visible) */}
      <FloatingIndicator excludedCount={excludedCount} onClick={handleIndicatorClick} />

      {/* Floating Menu (popup between icon and dashboard) */}
      <FloatingMenu open={menuOpen} theme={theme} onClose={handleMenuClose} onOpenDashboard={handleOpenDashboard} onToggleTheme={toggleTheme} excludedCount={excludedCount} totalSuppliers={suppliers.length} />

      {/* Dashboard Modal */}
      <Dashboard
        open={dashboardOpen}
        onClose={handleCloseDashboard}
        defaultTab={dashboardTab}
        onTabChange={setDashboardTab}
        suppliers={suppliers}
        preferences={preferences}
        loadingSuppliers={loadingSuppliers}
        onRefreshSuppliers={refreshSuppliers}
        config={config}
        onCommit={handleCommit}
        totalResults={totalResults}
      />
      {/* </div> */}
    </TooltipProvider>
  );
};

export default App;
