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
  pending?: boolean;
};

function FilterChipInner({ children, count, pending }: Pick<FilterChipProps, 'children' | 'count' | 'pending'>) {
  const { pending: linkPending } = useLinkStatus();
  const showPending = pending ?? linkPending;

  return (
    <>
      <span className={cn(showPending && 'opacity-70')}>{children}</span>
      {count !== undefined ? <span className="text-[10.5px] font-bold opacity-80">{count}</span> : null}
      {showPending ? <Loader2 size={12} className="shrink-0 animate-spin opacity-80" aria-hidden /> : null}
    </>
  );
}

const chipClassName = (active?: boolean, tone: 'light' | 'dark' = 'light') =>
  cn(
    'inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.75 text-xs font-semibold transition-all',
    tone === 'dark'
      ? active
        ? 'bg-white text-brand-deep shadow-sm'
        : 'border border-white/25 bg-white/10 text-white/80 hover:border-white/40 hover:bg-white/15 hover:text-white'
      : active
        ? 'border-b-[3px] border-b-brand-press bg-brand text-white'
        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
  );

export function FilterChip({
  children,
  active,
  count,
  href,
  onClick,
  pending,
  tone = 'light',
}: FilterChipProps & { tone?: 'light' | 'dark' }) {
  if (href) {
    return (
      <Link href={href} className={chipClassName(active, tone)}>
        <FilterChipInner count={count} pending={pending}>
          {children}
        </FilterChipInner>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={chipClassName(active, tone)} aria-busy={pending || undefined}>
      <FilterChipInner count={count} pending={pending}>
        {children}
      </FilterChipInner>
    </button>
  );
}
