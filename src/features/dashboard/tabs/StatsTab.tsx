/**
 * Statistics Tab — displays metrics and insights about filter usage.
 */

import {
  ChartBar,
  Clock,
  CurrencyEur,
  FunnelSimple,
  UsersThree,
} from '@phosphor-icons/react';

import { Separator } from '@/components/ui/separator';
import type { Supplier, SupplierPreference } from '@/core/types';

interface StatsTabProps {
  suppliers: Supplier[];
  preferences: Map<string, SupplierPreference>;
  totalResults: number;
}

export function StatsTab({ suppliers, preferences, totalResults }: StatsTabProps) {
  const totalSuppliers = suppliers.length;
  const excludedCount = suppliers.filter(
    (s) => preferences.get(s.id)?.excluded,
  ).length;
  const includedCount = totalSuppliers - excludedCount;

  // Find cheapest included supplier
  const cheapestIncluded = suppliers
    .filter((s) => !(preferences.get(s.id)?.excluded))
    .sort((a, b) => {
      const priceA = extractPrice(a.priceLabel);
      const priceB = extractPrice(b.priceLabel);
      return priceA - priceB;
    })[0];

  const cheapestPrice = cheapestIncluded ? extractPrice(cheapestIncluded.priceLabel) : 0;

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard
          icon={<UsersThree weight="duotone" className="h-4 w-4" />}
          label="Fournisseurs"
          value={`${includedCount}/${totalSuppliers}`}
          sublabel={`${excludedCount} exclus`}
          color="blue"
        />
        <MetricCard
          icon={<ChartBar weight="duotone" className="h-4 w-4" />}
          label="Résultats"
          value={totalResults > 0 ? totalResults.toLocaleString('fr-FR') : '—'}
          sublabel="total disponibles"
          color="purple"
        />
        <MetricCard
          icon={<CurrencyEur weight="duotone" className="h-4 w-4" />}
          label="Meilleur prix"
          value={cheapestPrice > 0 ? `${cheapestPrice} €` : '—'}
          sublabel={cheapestIncluded?.name ?? '—'}
          color="emerald"
        />
        <MetricCard
          icon={<Clock weight="duotone" className="h-4 w-4" />}
          label="Temps gagné"
          value={`~${Math.max(1, excludedCount * 2)}s`}
          sublabel="par recherche"
          color="amber"
        />
      </div>

      <Separator />

      {/* Filter Summary */}
      <div className="space-y-2 px-1">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FunnelSimple className="h-3 w-3" />
          Résumé des filtres
        </h4>

        {excludedCount === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucun fournisseur exclu. Tous les résultats sont affichés.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {suppliers
              .filter((s) => preferences.get(s.id)?.excluded)
              .map((s) => (
                <span
                  key={s.id}
                  className="
                    inline-flex items-center
                    text-[10px] font-medium
                    px-2 py-0.5 rounded-full
                    bg-destructive/10 text-destructive
                    border border-destructive/20
                  "
                >
                  {s.name}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal: Metric Card
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  color: 'blue' | 'purple' | 'emerald' | 'amber';
}

const colorMap = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
} as const;

function MetricCard({ icon, label, value, sublabel, color }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-border/50 bg-card">
      <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${colorMap[color]}`}>
        <span className={`p-1 rounded-md ${colorMap[color]}`}>{icon}</span>
        {label}
      </div>
      <div className="text-lg font-bold font-mono leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sublabel}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Extracts numeric price from a label like "à partir de 147 €". */
function extractPrice(label: string): number {
  const match = label.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
}
