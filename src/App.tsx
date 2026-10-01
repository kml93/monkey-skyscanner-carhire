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
import { ScrollInterceptor } from '@/core/ScrollInterceptor';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { FloatingIndicator } from '@/features/floating-indicator/FloatingIndicator';
import { FloatingMenu } from '@/features/floating-indicator/FloatingMenu';
import { type AutoConfig, type SupplierEntry } from '@/core/types';
import { useAutoConfig, useSuppliers, useTheme } from '@/hooks/useStorage';
import { useSkyscannerState } from '@/hooks/useSkyscannerState';

const App = ({ shadowHost }: { shadowHost: HTMLElement | null }) => {
  // ── State ────────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('suppliers');

  // ── Hooks ────────────────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();
  const { config, commitConfig } = useAutoConfig();
  const { suppliers: suppliersMap, commitSuppliers, excludedCount } = useSuppliers();
  const { suppliers, totalResults, loading: loadingSuppliers, refresh: refreshSuppliers } = useSkyscannerState();

  // ── Boot Sequence ────────────────────────────────────────────────────
  useEffect(() => {
    shadowHost?.classList.toggle('dark', theme === 'dark');
  }, [theme, shadowHost]);

  useEffect(() => {
    void (config.scrollLock ? ScrollInterceptor.enable() : ScrollInterceptor.disable());
  }, [config.scrollLock]);

  // Interceptor is installed at boot (main.tsx); only the filtering flag follows config.apiFilter
  useEffect(() => {
    ApiInterceptor.setFilterEnabled(config.apiFilter);
  }, [config.apiFilter]);

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
    (newConfig: AutoConfig, newSuppliers: Map<string, SupplierEntry>) => {
      commitConfig(newConfig);
      commitSuppliers(newSuppliers);
    },
    [commitConfig, commitSuppliers],
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
        suppliersMap={suppliersMap}
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
