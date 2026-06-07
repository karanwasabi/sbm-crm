'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type FilterChipProps = {
  children: ReactNode;
  active?: boolean;
  count?: string | number;
  onClick?: () => void;
};

export function FilterChip({ children, active, count, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.75 text-xs font-semibold transition-colors',
        active
          ? 'border-b-[3px] border-b-brand-press bg-brand text-white'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      )}
    >
      {children}
      {count !== undefined && <span className="text-[10.5px] font-bold opacity-80">{count}</span>}
    </button>
  );
}
