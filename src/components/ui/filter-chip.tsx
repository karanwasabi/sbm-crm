'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLinkStatus } from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type FilterChipProps = {
  children: ReactNode;
  active?: boolean;
  count?: string | number;
  href?: string;
  onClick?: () => void;
};

function FilterChipInner({ children, count }: Pick<FilterChipProps, 'children' | 'count'>) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span className={cn(pending && 'opacity-70')}>{children}</span>
      {count !== undefined ? <span className="text-[10.5px] font-bold opacity-80">{count}</span> : null}
      {pending ? <Loader2 size={12} className="shrink-0 animate-spin opacity-80" aria-hidden /> : null}
    </>
  );
}

const chipClassName = (active?: boolean) =>
  cn(
    'inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.75 text-xs font-semibold transition-colors',
    active
      ? 'border-b-[3px] border-b-brand-press bg-brand text-white'
      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
  );

export function FilterChip({ children, active, count, href, onClick }: FilterChipProps) {
  if (href) {
    return (
      <Link href={href} className={chipClassName(active)}>
        <FilterChipInner count={count}>{children}</FilterChipInner>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={chipClassName(active)}>
      {children}
      {count !== undefined ? <span className="text-[10.5px] font-bold opacity-80">{count}</span> : null}
    </button>
  );
}
