'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buildRenewalsHref, type RenewalFilters } from '@/lib/renewal-query';
import { cn } from '@/lib/cn';

type RenewalsSearchProps = {
  filters: RenewalFilters;
  onNavigate: (href: string) => void;
  className?: string;
};

export function RenewalsSearch({ filters, onNavigate, className }: RenewalsSearchProps) {
  const [value, setValue] = useState(filters.q);

  useEffect(() => {
    setValue(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed === filters.q.trim()) return;
      onNavigate(buildRenewalsHref(filters, { q: trimmed }));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [value, filters, onNavigate]);

  return (
    <div
      className={cn(
        'flex min-w-[220px] shrink-0 items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.25 shadow-sm',
        className
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search name or email"
        className="min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
