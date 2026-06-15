'use client';

import { Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { CrmStaffUser } from '@/components/layout/crm/crm-shell';
import { CrmUserMenu } from '@/components/layout/crm/crm-user-menu';
import { IconButton } from '@/components/ui/icon-button';
import { SearchInput } from '@/components/ui/search-input';
import { leadDatabaseSubtitle } from '@/lib/lead-display';
import { getPageMeta } from '@/lib/navigation';
import { useCrmContactName } from '@/components/layout/crm/crm-contact-context';

type CrmTopbarProps = {
  staffUser: CrmStaffUser;
  leadTotal: number;
};

function resolveSubtitle(pathname: string, leadTotal: number, contactName: string | null, fallback?: string) {
  if (pathname.startsWith('/customers/') && contactName) {
    return contactName;
  }
  if (pathname === '/database' || pathname.startsWith('/database/')) {
    return leadDatabaseSubtitle(leadTotal);
  }
  return fallback;
}

export function CrmTopbar({ staffUser, leadTotal }: CrmTopbarProps) {
  const pathname = usePathname();
  const { contactName } = useCrmContactName();
  const { title, subtitle } = getPageMeta(pathname);
  const resolvedSubtitle = resolveSubtitle(pathname, leadTotal, contactName, subtitle);

  return (
    <header className="flex shrink-0 items-center gap-4 border-b border-slate-100 bg-canvas px-6 py-4.5">
      <div className="min-w-[240px]">
        <h1 className="text-lg font-bold tracking-tight text-slate-800">{title}</h1>
        {resolvedSubtitle && <p className="mt-0.5 text-xs text-slate-500">{resolvedSubtitle}</p>}
      </div>

      <div className="max-w-[460px] flex-1">
        <SearchInput />
      </div>

      <div className="flex-1" />

      <IconButton showDot aria-label="Notifications">
        <Bell className="h-4 w-4" />
      </IconButton>

      <CrmUserMenu staffUser={staffUser} />
    </header>
  );
}
