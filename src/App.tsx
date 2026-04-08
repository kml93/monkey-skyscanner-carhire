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
import { DomObserver } from '@/core/DomObserver';
import { FilterEngine } from '@/core/FilterEngine';
import { ScrollInterceptor } from '@/core/ScrollInterceptor';
import { UIBootController } from '@/core/UIBootController';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { FloatingIndicator } from '@/features/floating-indicator/FloatingIndicator';
import { FloatingMenu } from '@/features/floating-indicator/FloatingMenu';
import { useAutoConfig, useExcludedSuppliers, useTheme } from '@/hooks/useStorage';
import { useSkyscannerState } from '@/hooks/useSkyscannerState';

const App = () => {
  // ── State ────────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('suppliers');

  // ── Hooks ────────────────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();
  const { config, updateConfig, resetConfig } = useAutoConfig();
  const {
    preferences,
    toggleSupplier,
    excludeAll,
    includeAll,
    excludedCount,
  } = useExcludedSuppliers();
  const {
    suppliers,
    totalResults,
    loading: loadingSuppliers,
    refresh: refreshSuppliers,
  } = useSkyscannerState();

  // ── Boot Sequence ────────────────────────────────────────────────────
  useEffect(() => {
    // Install scroll interceptor if enabled
    if (config.scrollLock) {
      ScrollInterceptor.enable();
    } else {
      ScrollInterceptor.disable();
    }
  }, [config.scrollLock]);

  useEffect(() => {
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
      UIBootController.reset();
      UIBootController.boot(config, () => {
        if (config.autoApply) {
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

  const handleOpenDashboard = useCallback((tab: string = 'suppliers') => {
    setDashboardTab(tab);
    setDashboardOpen(true);
    // Refresh supplier data when opening dashboard
    refreshSuppliers();
  }, [refreshSuppliers]);

  const handleCloseDashboard = useCallback(() => {
    setDashboardOpen(false);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <TooltipProvider delay={300}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        {/* Floating Indicator (always visible) */}
        <FloatingIndicator
          excludedCount={excludedCount}
          onClick={handleIndicatorClick}
        />

        {/* Floating Menu (popup between icon and dashboard) */}
        <FloatingMenu
          open={menuOpen}
          theme={theme}
          onClose={handleMenuClose}
          onOpenDashboard={handleOpenDashboard}
          onToggleTheme={toggleTheme}
          excludedCount={excludedCount}
          totalSuppliers={suppliers.length}
        />

        {/* Dashboard Modal */}
        <Dashboard
          open={dashboardOpen}
          onClose={handleCloseDashboard}
          defaultTab={dashboardTab}
          onTabChange={setDashboardTab}
          suppliers={suppliers}
          preferences={preferences}
          loadingSuppliers={loadingSuppliers}
          onToggleSupplier={toggleSupplier}
          onExcludeAll={excludeAll}
          onIncludeAll={includeAll}
          onRefreshSuppliers={refreshSuppliers}
          config={config}
          onUpdateConfig={updateConfig}
          onResetConfig={resetConfig}
          totalResults={totalResults}
        />
      </div>
    </TooltipProvider>
  );
};

export default App;
