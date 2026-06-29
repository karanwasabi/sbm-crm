'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';

type LeadDatabaseSearchProps = {
  filters: LeadDatabaseFilters;
};

export function LeadDatabaseSearch({ filters }: LeadDatabaseSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(filters.q);

  useEffect(() => {
    setValue(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed === filters.q.trim()) return;
      router.push(buildLeadDatabaseHref(filters, { q: trimmed }));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [value, filters, router]);

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
      <Search className="h-4 w-4 shrink-0 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search first name, last name, or email"
        className="min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
