/**
 * Suppliers Tab — manage supplier exclusion preferences.
 *
 * Displays all scraped suppliers with toggle controls.
 * Changes are persisted immediately but DOM application
 * only happens on dashboard close (batch execution).
 */

import {
  ArrowsClockwise,
  FunnelSimple,
  MagnifyingGlass,
  Prohibit,
  ShieldCheck,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { SortOption, Supplier, SupplierPreference } from '@/core/types';
import { SupplierCard } from '../components/SupplierCard';

interface SuppliersTabProps {
  suppliers: Supplier[];
  preferences: Map<string, SupplierPreference>;
  loading: boolean;
  onToggle: (id: string, name: string) => void;
  onExcludeAll: (suppliers: Array<{ id: string; name: string }>) => void;
  onIncludeAll: () => void;
  onRefresh: () => void;
}

export function SuppliersTab({
  suppliers,
  preferences,
  loading,
  onToggle,
  onExcludeAll,
  onIncludeAll,
  onRefresh,
}: SuppliersTabProps) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'excluded' | 'included'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('price-asc');

  // Filter and search suppliers
  const filteredSuppliers = useMemo(() => {
    let result = suppliers;

    // Apply text search
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.id.includes(query),
      );
    }

    // Apply status filter
    if (filterMode !== 'all') {
      result = result.filter((s) => {
        const excluded = preferences.get(s.id)?.excluded ?? false;
        return filterMode === 'excluded' ? excluded : !excluded;
      });
    }

    // Apply sorting (copy to avoid mutating source if it's not a new array)
    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        case 'name-desc':
          return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        default:
          return 0;
      }
    });

    return result;
  }, [suppliers, search, filterMode, preferences, sortOption]);

  const excludedCount = suppliers.filter(
    (s) => preferences.get(s.id)?.excluded,
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Stats Bar */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{suppliers.length}</span> suppliers
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-destructive">{excludedCount}</span> excluded
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-7 px-2 text-xs"
          >
            <ArrowsClockwise className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-2 px-1 pb-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full h-8 pl-8 pr-3 text-xs
              bg-muted/50 border border-border rounded-lg
              placeholder:text-muted-foreground/60
              focus:outline-none focus:ring-1 focus:ring-ring
              font-mono
            "
          />
        </div>

        <div className="flex items-center border border-border rounded-lg overflow-hidden h-8">
          <FilterButton
            active={filterMode === 'all'}
            onClick={() => setFilterMode('all')}
            title="All suppliers"
          >
            <FunnelSimple className="h-3.5 w-3.5" />
          </FilterButton>
          <FilterButton
            active={filterMode === 'included'}
            onClick={() => setFilterMode('included')}
            title="Included suppliers"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
          </FilterButton>
          <FilterButton
            active={filterMode === 'excluded'}
            onClick={() => setFilterMode('excluded')}
            title="Excluded suppliers"
          >
            <Prohibit className="h-3.5 w-3.5" />
          </FilterButton>
        </div>

        <Select
          value={sortOption}
          onValueChange={(value) => setSortOption(value as SortOption)}
        >
          <SelectTrigger className="w-[85px] h-8 px-2 text-[10px] font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="bottom" align="end" className="text-[10px]">
            <SelectItem value="price-asc">Price ↑</SelectItem>
            <SelectItem value="price-desc">Price ↓</SelectItem>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Bulk Actions */}
      <div className="flex items-center gap-2 px-1 py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExcludeAll(suppliers.map((s) => ({ id: s.id, name: s.name })))}
          className="text-xs h-7"
        >
          <Prohibit className="h-3 w-3 mr-1" />
          Exclude all
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onIncludeAll}
          className="text-xs h-7"
        >
          <ShieldCheck className="h-3 w-3 mr-1" />
          Include all
        </Button>
      </div>

      <Separator />

      {/* Supplier List */}
      <ScrollArea className="flex-1 mt-2">
        <div className="flex flex-col gap-1.5 px-1 pb-4">
          {loading && (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              <ArrowsClockwise className="h-4 w-4 mr-2 animate-spin" />
              Loading suppliers...
            </div>
          )}

          {!loading && filteredSuppliers.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No suppliers found.
            </div>
          )}

          {!loading &&
            filteredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                id={supplier.id}
                name={supplier.name}
                priceLabel={supplier.priceLabel}
                excluded={preferences.get(supplier.id)?.excluded ?? false}
                onToggle={() => onToggle(supplier.id, supplier.name)}
              />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal: Filter Toggle Button
// ---------------------------------------------------------------------------

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}

function FilterButton({ active, onClick, children, title }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        h-full px-2 text-xs transition-colors cursor-pointer
        ${active
          ? 'bg-primary text-primary-foreground'
          : 'bg-background text-muted-foreground hover:bg-accent'
        }
      `}
    >
      {children}
    </button>
  );
}
