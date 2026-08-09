'use client';

import { Search } from 'lucide-react';
import type { PerformanceSortDirection } from '@/hooks/use-performance-table-state';

type SortOption<T extends string> = {
  key: T;
  label: string;
};

type PerformanceTableToolbarProps<T extends string> = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortKey: T;
  sortDirection: PerformanceSortDirection;
  sortOptions: SortOption<T>[];
  onSortKeyChange: (key: T) => void;
  onSortDirectionChange: (direction: PerformanceSortDirection) => void;
};

export function PerformanceTableToolbar<T extends string>({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  sortKey,
  sortDirection,
  sortOptions,
  onSortKeyChange,
  onSortDirectionChange,
}: PerformanceTableToolbarProps<T>) {
  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 ring-brand/20 outline-none placeholder:text-slate-400 focus:ring-2"
        />
      </label>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-500">Sort</label>
        <select
          value={sortKey}
          onChange={(event) => onSortKeyChange(event.target.value as T)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ring-brand/20 outline-none focus:ring-2"
        >
          {sortOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={sortDirection}
          onChange={(event) => onSortDirectionChange(event.target.value as PerformanceSortDirection)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ring-brand/20 outline-none focus:ring-2"
        >
          <option value="desc">High to low</option>
          <option value="asc">Low to high</option>
        </select>
      </div>
    </div>
  );
}
