'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useTransition } from 'react';
import { useDebouncedSearchInput } from '@/hooks/use-debounced-search-input';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { cn } from '@/lib/cn';

type LeadDatabaseSearchProps = {
  filters: LeadDatabaseFilters;
  className?: string;
};

export function LeadDatabaseSearch({ filters, className }: LeadDatabaseSearchProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const onCommit = useCallback(
    (trimmedQuery: string) => {
      const href = buildLeadDatabaseHref(filtersRef.current, { q: trimmedQuery });
      startTransition(() => {
        router.replace(href);
      });
    },
    [router, startTransition]
  );

  const { value, setValue, inputRef, onBlur, onKeyDown } = useDebouncedSearchInput({
    committedQuery: filters.q,
    debounceMs: 400,
    onCommit,
  });

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.25 shadow-sm',
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
