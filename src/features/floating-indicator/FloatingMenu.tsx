/**
 * Floating Menu — popup menu that appears after clicking the floating indicator.
 *
 * This is the intermediary between the floating icon and the dashboard modal.
 * Provides quick-access actions and a "Dashboard" entry point.
 */

import {
  ChartBar,
  Faders,
  GearSix,
  Moon,
  Sun,
  X,
} from '@phosphor-icons/react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface FloatingMenuProps {
  open: boolean;
  theme: 'light' | 'dark';
  onClose: () => void;
  onOpenDashboard: (tab?: string) => void;
  onToggleTheme: () => void;
  excludedCount: number;
  totalSuppliers: number;
}

export function FloatingMenu({
  open,
  theme,
  onClose,
  onOpenDashboard,
  onToggleTheme,
  excludedCount,
  totalSuppliers,
}: FloatingMenuProps) {
  const handleDashboard = useCallback((tab?: string) => {
    onOpenDashboard(tab);
    onClose();
  }, [onOpenDashboard, onClose]);

  if (!open) return null;

  return (
    <div
      className="
        fixed bottom-18 left-4 z-[2147483647]
        w-64 rounded-xl
        bg-popover text-popover-foreground
        border border-border
        shadow-2xl shadow-black/20
        animate-in slide-in-from-bottom-2 fade-in duration-200
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold tracking-tight">
          Skyscanner Tools
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
          aria-label="Fermer le menu"
        >
          <X weight="bold" className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-2 bg-muted/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Fournisseurs exclus</span>
          <span className="font-mono font-semibold text-foreground">
            {excludedCount}/{totalSuppliers}
          </span>
        </div>
      </div>

      <Separator />

      {/* Menu Items */}
      <div className="p-1.5">
        <MenuButton
          icon={<Faders weight="duotone" className="h-4 w-4" />}
          label="Dashboard"
          description="Gérer les fournisseurs"
          onClick={() => handleDashboard('suppliers')}
        />

        <MenuButton
          icon={<GearSix weight="duotone" className="h-4 w-4" />}
          label="Configuration"
          description="Paramètres automatiques"
          onClick={() => handleDashboard('config')}
        />

        <MenuButton
          icon={<ChartBar weight="duotone" className="h-4 w-4" />}
          label="Statistiques"
          description="Métriques & insights"
          onClick={() => handleDashboard('stats')}
        />

        <Separator className="my-1" />

        <MenuButton
          icon={theme === 'dark'
            ? <Sun weight="duotone" className="h-4 w-4" />
            : <Moon weight="duotone" className="h-4 w-4" />
          }
          label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          description="Basculer le thème"
          onClick={onToggleTheme}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal: Menu Button
// ---------------------------------------------------------------------------

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}

function MenuButton({ icon, label, description, onClick }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full flex items-center gap-3 px-3 py-2 rounded-lg
        text-left text-sm
        hover:bg-accent transition-colors duration-150
        cursor-pointer
      "
    >
      <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm leading-tight">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
    </button>
  );
}
