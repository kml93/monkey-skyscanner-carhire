/**
 * Dashboard Modal — the main control panel.
 *
 * Uses a draft/commit pattern: all changes (config toggles, supplier
 * exclusions) are buffered in local state until the user clicks Apply.
 * Closing the dialog (X / ESC) discards pending changes.
 *
 * Max width: 7xl for desktop readiness, fullscreen on mobile.
 */

import { X } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiInterceptor } from '@/core/ApiInterceptor';
import { FilterEngine } from '@/core/FilterEngine';
import { DEFAULT_AUTO_CONFIG, type AutoConfig, type Supplier, type SupplierPreference } from '@/core/types';
import { UIBootController } from '@/core/UIBootController';
import { AutoConfigTab } from './tabs/AutoConfigTab';
import { StatsTab } from './tabs/StatsTab';
import { SuppliersTab } from './tabs/SuppliersTab';

interface DashboardProps {
  open: boolean;
  onClose: () => void;
  defaultTab: string;
  onTabChange: (tab: string) => void;
  // Committed state (read-only snapshots)
  suppliers: Supplier[];
  preferences: Map<string, SupplierPreference>;
  loadingSuppliers: boolean;
  config: AutoConfig;
  // Commit callback — persists draft config + preferences atomically
  onCommit: (config: AutoConfig, preferences: Map<string, SupplierPreference>) => void;
  // Utilities
  onRefreshSuppliers: () => void;
  totalResults: number;
}

export function Dashboard({ open, onClose, defaultTab, onTabChange, suppliers, preferences, loadingSuppliers, config, onCommit, onRefreshSuppliers, totalResults }: DashboardProps) {
  // ── Draft State ────────────────────────────────────────────────────────
  const [draftConfig, setDraftConfig] = useState<AutoConfig>(config);
  const [draftPreferences, setDraftPreferences] = useState<Map<string, SupplierPreference>>(preferences);

  // Initialize drafts from committed state when dialog opens
  useEffect(() => {
    if (open) {
      setDraftConfig({ ...config });
      setDraftPreferences(new Map(preferences));
    }
    // Only react to `open` changes — not config/preferences updates mid-session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Draft Handlers ─────────────────────────────────────────────────────

  const handleUpdateDraftConfig = useCallback((partial: Partial<AutoConfig>) => {
    setDraftConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleResetDraftConfig = useCallback(() => {
    setDraftConfig({ ...DEFAULT_AUTO_CONFIG });
  }, []);

  const handleToggleDraftSupplier = useCallback((id: string, name: string) => {
    setDraftPreferences((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      next.set(id, {
        id,
        name,
        excluded: !(existing?.excluded ?? false),
      });
      return next;
    });
  }, []);

  const handleExcludeAllDraft = useCallback((supplierList: Array<{ id: string; name: string }>) => {
    setDraftPreferences((prev) => {
      const next = new Map(prev);
      for (const s of supplierList) {
        next.set(s.id, { id: s.id, name: s.name, excluded: true });
      }
      return next;
    });
  }, []);

  const handleIncludeAllDraft = useCallback(() => {
    setDraftPreferences((prev) => {
      const next = new Map(prev);
      for (const [, pref] of next) {
        next.set(pref.id, { ...pref, excluded: false });
      }
      return next;
    });
  }, []);

  // ── Commit & Close ─────────────────────────────────────────────────────

  /** Commit draft state to parent and trigger re-fetch. */
  const handleApply = useCallback(async () => {
    onCommit(draftConfig, draftPreferences);

    if (!draftConfig.apiFilter) {
      await FilterEngine.apply(draftPreferences);
    } else {
      // Stealth mode: install interceptor with new preferences before re-fetch
      // so the sort toggle API call is intercepted with updated data
      ApiInterceptor.install(draftPreferences);
    }

    await UIBootController.triggerRefetch();
  }, [draftConfig, draftPreferences, onCommit]);

  /** Commit + close (re-fetch runs in background). */
  const handleApplyAndClose = useCallback(() => {
    void handleApply();
    onClose();
  }, [handleApply, onClose]);

  // Excluded count from DRAFT (reflects pending changes in header badge)
  const excludedCount = Array.from(draftPreferences.values()).filter((p) => p.excluded).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen, eventDetails) => {
        if (!isOpen && eventDetails?.reason === 'outside-press') return;
        if (!isOpen) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="flex flex-col max-w-7xl max-h-[90vh] rounded-2xl max-sm:rounded-none">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-bold tracking-tight">Skyscanner Dashboard</DialogTitle>
            <DialogDescription className="sr-only">Control panel for Skyscanner filters and automatic configuration.</DialogDescription>
            {excludedCount > 0 && <span className="text-xs font-mono text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">{excludedCount} excluded</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg" aria-label="Close dashboard">
            <X weight="bold" className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Separator />

        {/* Tabs */}
        <Tabs value={defaultTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto px-6 py-0 shrink-0">
            <TabsTrigger value="suppliers" className="data-active:border-b-2 data-active:border-primary rounded-none pb-2.5 pt-3 px-1 mr-6 text-sm">
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="config" className="data-active:border-b-2 data-active:border-primary rounded-none pb-2.5 pt-3 px-1 mr-6 text-sm">
              Config
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-active:border-b-2 data-active:border-primary rounded-none pb-2.5 pt-3 px-1 mr-6 text-sm">
              Stats
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 px-6 py-4 overflow-auto">
            <TabsContent value="suppliers" className="h-full mt-0">
              <SuppliersTab
                suppliers={suppliers}
                preferences={draftPreferences}
                loading={loadingSuppliers}
                onToggle={handleToggleDraftSupplier}
                onExcludeAll={handleExcludeAllDraft}
                onIncludeAll={handleIncludeAllDraft}
                onRefresh={onRefreshSuppliers}
              />
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              <AutoConfigTab config={draftConfig} onUpdate={handleUpdateDraftConfig} onReset={handleResetDraftConfig} />
            </TabsContent>

            <TabsContent value="stats" className="mt-0">
              <StatsTab suppliers={suppliers} preferences={draftPreferences} totalResults={totalResults} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <Separator />
        <div className="flex items-center justify-between px-6 py-3 shrink-0">
          <span className="text-[10px] text-muted-foreground font-mono">{/* •  */}Tampermonkey Dashboard</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleApply} className="text-xs h-8">
              Apply
            </Button>
            <Button variant="default" size="sm" onClick={handleApplyAndClose} className="text-xs h-8">
              Apply & Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
