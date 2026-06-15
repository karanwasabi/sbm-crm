'use client';

import { Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { CrmStaffUser } from '@/components/layout/crm/crm-shell';
import { CrmUserMenu } from '@/components/layout/crm/crm-user-menu';
import { IconButton } from '@/components/ui/icon-button';
import { SearchInput } from '@/components/ui/search-input';
import { getPageMeta } from '@/lib/navigation';

type CrmTopbarProps = {
  staffUser: CrmStaffUser;
};

export function CrmTopbar({ staffUser }: CrmTopbarProps) {
  const pathname = usePathname();
  const { title, subtitle } = getPageMeta(pathname);

  return (
    <header className="flex shrink-0 items-center gap-4 border-b border-slate-100 bg-canvas px-6 py-4.5">
      <div className="min-w-[240px]">
        <h1 className="text-lg font-bold tracking-tight text-slate-800">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
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
