/**
 * Supplier Card — individual supplier row in the SuppliersTab.
 *
 * Displays supplier name, price label, and an exclusion toggle.
 */

import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import type { SupplierStatus } from '@/core/types';

interface SupplierCardProps {
  id: string;
  name: string;
  priceLabel: string;
  status: SupplierStatus;
  onToggle: () => void;
}

export function SupplierCard({
  name,
  priceLabel,
  status,
  onToggle,
}: SupplierCardProps) {
  const excluded = status === 'excluded';

  return (
    <div
      className={`
        flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg
        border border-border/50
        transition-all duration-200 ease-out
        ${excluded
          ? 'bg-destructive/5 border-destructive/20 opacity-70'
          : 'bg-card hover:bg-accent/50'
        }
      `}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{name}</span>
          <StatusBadge status={status} />
        </div>
        {priceLabel && (
          <span className="text-xs text-muted-foreground mt-0.5 block">
            {priceLabel}
          </span>
        )}
      </div>

      <Button
        variant={excluded ? 'outline' : 'destructive'}
        size="sm"
        onClick={onToggle}
        className="text-xs h-7 px-2.5 flex-shrink-0"
      >
        {excluded ? 'Include' : 'Exclude'}
      </Button>
    </div>
  );
}
