'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { PerformanceSortDirection } from '@/hooks/use-performance-table-state';
import { cn } from '@/lib/cn';

type PerformanceSortableHeaderProps<T extends string> = {
  label: string;
  sortKey: T;
  activeSortKey: T;
  sortDirection: PerformanceSortDirection;
  onSort: (key: T) => void;
  className?: string;
};

export function PerformanceSortableHeader<T extends string>({
  label,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
  className,
}: PerformanceSortableHeaderProps<T>) {
  const active = activeSortKey === sortKey;
  const Icon = !active ? ArrowUpDown : sortDirection === 'asc' ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[10px] font-bold tracking-[0.14em] uppercase transition-colors hover:text-brand',
        active ? 'text-brand' : 'text-slate-500',
        className
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  );
}
