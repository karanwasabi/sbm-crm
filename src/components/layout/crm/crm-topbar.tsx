'use client';

import { usePathname } from 'next/navigation';
import type { CrmStaffUser } from '@/components/layout/crm/crm-shell';
import { CRM_HEADER_ROW_CLASS } from '@/components/layout/crm/crm-header-row';
import { CrmUserMenu } from '@/components/layout/crm/crm-user-menu';
import { leadDatabaseSubtitle } from '@/lib/lead-display';
import { getPageMeta } from '@/lib/navigation';
import { cn } from '@/lib/cn';
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
    <header className={cn(CRM_HEADER_ROW_CLASS, 'gap-4 px-6')}>
      <div className="min-w-0">
        <h1 className="truncate text-lg leading-tight font-bold tracking-tight text-slate-800">{title}</h1>
        {resolvedSubtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{resolvedSubtitle}</p>}
      </div>

      <div className="flex-1" />

      <CrmUserMenu staffUser={staffUser} />
    </header>
  );
}
