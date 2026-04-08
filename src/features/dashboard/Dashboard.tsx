/**
 * Dashboard Modal — the main control panel.
 *
 * Opens as a full-featured modal dialog with three tabs:
 * Suppliers, Auto-Config, and Statistics.
 *
 * On close, triggers the FilterEngine to batch-apply exclusions.
 * Max width: 7xl for desktop readiness, fullscreen on mobile.
 */

import { X } from '@phosphor-icons/react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterEngine } from '@/core/FilterEngine';
import type { AutoConfig, Supplier, SupplierPreference } from '@/core/types';
import { AutoConfigTab } from './tabs/AutoConfigTab';
import { StatsTab } from './tabs/StatsTab';
import { SuppliersTab } from './tabs/SuppliersTab';

interface DashboardProps {
  open: boolean;
  onClose: () => void;
  defaultTab: string;
  onTabChange: (tab: string) => void;
  // Supplier state
  suppliers: Supplier[];
  preferences: Map<string, SupplierPreference>;
  loadingSuppliers: boolean;
  onToggleSupplier: (id: string, name: string) => void;
  onExcludeAll: (suppliers: Array<{ id: string; name: string }>) => void;
  onIncludeAll: () => void;
  onRefreshSuppliers: () => void;
  // Config state
  config: AutoConfig;
  onUpdateConfig: (partial: Partial<AutoConfig>) => void;
  onResetConfig: () => void;
  // Stats
  totalResults: number;
}

export function Dashboard({
  open,
  onClose,
  defaultTab,
  onTabChange,
  suppliers,
  preferences,
  loadingSuppliers,
  onToggleSupplier,
  onExcludeAll,
  onIncludeAll,
  onRefreshSuppliers,
  config,
  onUpdateConfig,
  onResetConfig,
  totalResults,
}: DashboardProps) {
  /**
   * On close: batch-apply the exclusion rules to the Skyscanner DOM.
   * This is where all checkbox unchecks happen silently.
   */
  const handleClose = useCallback(() => {
    // Apply filter rules in batch
    FilterEngine.apply(preferences);
    onClose();
  }, [preferences, onClose]);

  const excludedCount = Array.from(preferences.values()).filter((p) => p.excluded).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen, eventDetails) => {
        if (!isOpen && eventDetails?.reason === 'outside-press') return;
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent
        className="
          max-w-7xl w-[95vw] h-[85vh]
          flex flex-col
          p-0 gap-0
          rounded-2xl
          max-sm:h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:rounded-none
        "
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-bold tracking-tight">
              Skyscanner Dashboard
            </DialogTitle>
            <DialogDescription className="sr-only">
              Control panel for Skyscanner filters and automatic configuration.
            </DialogDescription>
            {excludedCount > 0 && (
              <span className="text-xs font-mono text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                {excludedCount} excluded
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-lg"
            aria-label="Close dashboard"
          >
            <X weight="bold" className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Separator />

        {/* Tabs */}
        <Tabs
          value={defaultTab}
          onValueChange={onTabChange}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto px-6 py-0 flex-shrink-0">
            <TabsTrigger
              value="suppliers"
              className="data-active:border-b-2 data-active:border-primary rounded-none pb-2.5 pt-3 px-1 mr-6 text-sm"
            >
              Suppliers
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className="data-active:border-b-2 data-active:border-primary rounded-none pb-2.5 pt-3 px-1 mr-6 text-sm"
            >
              Config
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-active:border-b-2 data-active:border-primary rounded-none pb-2.5 pt-3 px-1 mr-6 text-sm"
            >
              Stats
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 px-6 py-4 overflow-auto">
            <TabsContent value="suppliers" className="h-full mt-0">
              <SuppliersTab
                suppliers={suppliers}
                preferences={preferences}
                loading={loadingSuppliers}
                onToggle={onToggleSupplier}
                onExcludeAll={onExcludeAll}
                onIncludeAll={onIncludeAll}
                onRefresh={onRefreshSuppliers}
              />
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              <AutoConfigTab
                config={config}
                onUpdate={onUpdateConfig}
                onReset={onResetConfig}
              />
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              <StatsTab
                suppliers={suppliers}
                preferences={preferences}
                totalResults={totalResults}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <Separator />
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground font-mono">
            v0.1.0 • Tampermonkey Dashboard
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={handleClose}
            className="text-xs h-8"
          >
            Apply & Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
