'use client';

import { Search } from 'lucide-react';

type SearchInputProps = {
  placeholder?: string;
};

export function SearchInput({ placeholder = 'Search leads, cohorts, campaigns…' }: SearchInputProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-slate-100 bg-white px-4 py-2.25">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        type="search"
        placeholder={placeholder}
        className="min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
      />
      <span className="text-[10px] font-semibold tracking-[0.12em] text-slate-400">⌘K</span>
    </div>
  );
}
