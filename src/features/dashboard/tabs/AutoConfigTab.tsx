/**
 * Auto-Configuration Tab — toggle switches for automatic behaviors.
 *
 * Each toggle is persisted individually via StorageService.
 */

import {
  ArrowsDownUp,
  ArrowsOutSimple,
  FolderSimpleMinus,
  LockSimple,
  ShieldCheck,
} from '@phosphor-icons/react';

import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { AutoConfig } from '@/core/types';

interface AutoConfigTabProps {
  config: AutoConfig;
  onUpdate: (partial: Partial<AutoConfig>) => void;
  onReset: () => void;
}

export function AutoConfigTab({ config, onUpdate, onReset }: AutoConfigTabProps) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <p className="text-xs text-muted-foreground px-1 mb-2">
        These settings apply automatically on every page load.
      </p>

      <ConfigRow
        icon={<ArrowsDownUp weight="duotone" className="h-4 w-4" />}
        label="Auto Sort"
        description={`Force "Cheapest" sort on load`}
        checked={config.sortCheapest}
        onChange={(v) => onUpdate({ sortCheapest: v })}
      />

      <Separator className="my-1" />

      <ConfigRow
        icon={<FolderSimpleMinus weight="duotone" className="h-4 w-4" />}
        label="Accordion Folding"
        description="Close all filters except Providers"
        checked={config.foldAccordions}
        onChange={(v) => onUpdate({ foldAccordions: v })}
      />

      <Separator className="my-1" />

      <ConfigRow
        icon={<ArrowsOutSimple weight="duotone" className="h-4 w-4" />}
        label="Supplier Expansion"
        description="Expand and check all suppliers on load"
        checked={config.expandAllSuppliers}
        onChange={(v) => onUpdate({ expandAllSuppliers: v })}
      />

      <Separator className="my-1" />

      <ConfigRow
        icon={<LockSimple weight="duotone" className="h-4 w-4" />}
        label="Scroll Lock"
        description="Block Skyscanner's auto-scroll behavior"
        checked={config.scrollLock}
        onChange={(v) => onUpdate({ scrollLock: v })}
      />

      <Separator className="my-1" />

      <ConfigRow
        icon={<ShieldCheck weight="duotone" className="h-4 w-4" />}
        label="Stealth Filter"
        description="Intercept API responses instead of clicking checkboxes (SPA only)"
        checked={config.apiFilter}
        onChange={(v) => onUpdate({ apiFilter: v })}
      />

      <Separator className="my-3" />

      <button
        type="button"
        onClick={onReset}
        className="
          text-xs text-muted-foreground hover:text-foreground
          transition-colors cursor-pointer px-1
          underline underline-offset-2 self-start
        "
      >
        Reset to default settings
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal: Config Row
// ---------------------------------------------------------------------------

interface ConfigRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ConfigRow({ icon, label, description, checked, onChange }: ConfigRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-2 rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="shrink-0 text-muted-foreground">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-tight">{label}</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {description}
          </div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
