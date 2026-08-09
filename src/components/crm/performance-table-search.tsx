'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

type PerformanceTableSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function PerformanceTableSearch({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: PerformanceTableSearchProps) {
  return (
    <div
      className={cn(
        'flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-sm sm:max-w-[220px] sm:flex-none',
        className
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
