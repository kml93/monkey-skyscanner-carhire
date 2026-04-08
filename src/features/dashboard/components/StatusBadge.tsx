/**
 * Status Badge — visual indicator for supplier inclusion/exclusion state.
 */

import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  excluded: boolean;
}

export function StatusBadge({ excluded }: StatusBadgeProps) {
  if (excluded) {
    return (
      <Badge
        variant="destructive"
        className="text-[10px] px-1.5 py-0 h-5 font-semibold"
      >
        Exclu
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="text-[10px] px-1.5 py-0 h-5 font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    >
      Inclus
    </Badge>
  );
}
