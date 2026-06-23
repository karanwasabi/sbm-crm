'use client';

import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLinkStatus } from 'next/link';
import { cn } from '@/lib/cn';

type CrmNavLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

function CrmNavLinkInner({ label, icon: Icon, active }: Pick<CrmNavLinkProps, 'label' | 'icon' | 'active'>) {
  const { pending } = useLinkStatus();

  return (
    <>
      <Icon size={17} className={cn(active ? 'text-white' : 'text-slate-500', pending && !active && 'opacity-60')} />
      <span className={cn('flex-1', pending && !active && 'opacity-70')}>{label}</span>
      {pending ? <Loader2 size={14} className="shrink-0 animate-spin text-slate-400" aria-hidden /> : null}
    </>
  );
}

export function CrmNavLink({ href, label, icon, active }: CrmNavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] font-semibold transition-colors',
        active
          ? 'border-b-[3px] border-b-brand-press bg-brand font-bold text-white shadow-[0_8px_14px_-6px_rgba(92,101,207,0.40)]'
          : 'border-b-[3px] border-transparent text-slate-700 hover:bg-white/60'
      )}
    >
      <CrmNavLinkInner label={label} icon={icon} active={active} />
    </Link>
  );
}
