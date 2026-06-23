'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLinkStatus } from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CrmTableLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

function CrmTableLinkInner({ children }: Pick<CrmTableLinkProps, 'children'>) {
  const { pending } = useLinkStatus();

  return (
    <span className={cn('inline-flex items-center gap-1.5', pending && 'opacity-70')}>
      {children}
      {pending ? <Loader2 size={12} className="shrink-0 animate-spin text-slate-400" aria-hidden /> : null}
    </span>
  );
}

export function CrmTableLink({ href, children, className }: CrmTableLinkProps) {
  return (
    <Link href={href} className={cn('no-underline hover:underline', className)}>
      <CrmTableLinkInner>{children}</CrmTableLinkInner>
    </Link>
  );
}
