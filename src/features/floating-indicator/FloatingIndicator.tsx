/**
 * Floating Indicator — anchored icon button in the bottom-left corner.
 *
 * Inspired by the Next.js dev indicator. Displays a small icon with
 * an exclusion count badge. Clicking opens the FloatingMenu.
 */

import { Car } from '@phosphor-icons/react';
import { useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FloatingIndicatorProps {
  excludedCount: number;
  onClick: () => void;
}

export function FloatingIndicator({ excludedCount, onClick }: FloatingIndicatorProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick();
    },
    [onClick],
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="default"
            size="icon"
            onClick={handleClick}
            className="
              fixed bottom-4 left-4 z-[2147483647]
              h-11 w-11 rounded-full
              bg-[#0770e3] hover:bg-[#0559b3]
              shadow-lg shadow-blue-500/25
              transition-all duration-300 ease-out
              hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40
              active:scale-95
              animate-in fade-in zoom-in-50 duration-500
            "
            aria-label="Ouvrir le Dashboard Skyscanner"
          />
        }
      >
        <Car weight="fill" className="h-5 w-5 text-white" />

        {excludedCount > 0 && (
          <Badge
            variant="destructive"
            className="
              absolute -top-1.5 -right-1.5
              h-5 min-w-5 px-1
              text-[10px] font-bold
              flex items-center justify-center
              animate-in zoom-in-50 duration-300
            "
          >
            {excludedCount}
          </Badge>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        Dashboard Skyscanner
      </TooltipContent>
    </Tooltip>
  );
}
