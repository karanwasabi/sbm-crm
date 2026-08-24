'use client';

import { Search } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useDebouncedSearchInput } from '@/hooks/use-debounced-search-input';
import { buildRenewalsHref, type RenewalFilters } from '@/lib/renewal-query';
import { cn } from '@/lib/cn';

type RenewalsSearchProps = {
  filters: RenewalFilters;
  onNavigate: (href: string) => void;
  className?: string;
};

export function RenewalsSearch({ filters, onNavigate, className }: RenewalsSearchProps) {
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  const onCommit = useCallback((trimmedQuery: string) => {
    onNavigateRef.current(buildRenewalsHref(filtersRef.current, { q: trimmedQuery }));
  }, []);

  const { value, setValue, inputRef, onBlur, onKeyDown } = useDebouncedSearchInput({
    committedQuery: filters.q,
    debounceMs: 400,
    onCommit,
  });

  return (
    <div
      className={cn(
        'flex min-w-[220px] shrink-0 items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.25 shadow-sm',
        className
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="Search name or email"
        autoComplete="off"
        spellCheck={false}
        className="min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
