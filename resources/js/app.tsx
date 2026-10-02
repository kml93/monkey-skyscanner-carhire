/**
 * Root Application Component.
 *
 * Manages global UI state flow:
 * FloatingIndicator → FloatingMenu → Dashboard Modal
 */

import { useCallback, useEffect, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { FloatingIndicator } from '@/features/floating-indicator/FloatingIndicator';
import { FloatingMenu } from '@/features/floating-indicator/FloatingMenu';
import { useAutoConfig } from '@/hooks/useAutoConfig';
import { useResultCount } from '@/hooks/useResultCount';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useTheme } from '@/hooks/useTheme';
import type { AutoConfig } from '@app/Settings/Data/AutoConfig';
import type { SupplierMap } from '@app/Suppliers/Data/SupplierMap';

const App = ({ shadowHost }: { shadowHost: HTMLElement | null }) => {
  // ── State ────────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('suppliers');

  // ── Hooks ────────────────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();
  const { config, commitConfig } = useAutoConfig();
  const { suppliers: suppliersMap, commitSuppliers, excludedCount } = useSuppliers();
  const { totalResults, loading: loadingSuppliers, refresh: refreshSuppliers } = useResultCount();

  useEffect(() => {
    shadowHost?.classList.toggle('dark', theme === 'dark');
  }, [theme, shadowHost]);

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
    (newConfig: AutoConfig, newSuppliers: SupplierMap) => {
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
      <FloatingMenu open={menuOpen} theme={theme} onClose={handleMenuClose} onOpenDashboard={handleOpenDashboard} onToggleTheme={toggleTheme} excludedCount={excludedCount} totalSuppliers={suppliersMap.size} />

      {/* Dashboard Modal */}
      <Dashboard
        open={dashboardOpen}
        onClose={handleCloseDashboard}
        defaultTab={dashboardTab}
        onTabChange={setDashboardTab}
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
