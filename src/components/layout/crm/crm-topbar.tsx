'use client';

import { usePathname } from 'next/navigation';
import type { CrmStaffUser } from '@/components/layout/crm/crm-shell';
import { useCrmContactName } from '@/components/layout/crm/crm-contact-context';
import { useCrmDashboardFilter } from '@/components/layout/crm/crm-dashboard-filter-context';
import { CRM_HEADER_ROW_CLASS } from '@/components/layout/crm/crm-header-row';
import { useCrmLeadSummary } from '@/components/layout/crm/crm-lead-summary-context';
import { useCrmRenewalSummary } from '@/components/layout/crm/crm-renewal-summary-context';
import { CrmUserMenu } from '@/components/layout/crm/crm-user-menu';
import { CrmWhatsAppUnreadBadge } from '@/components/layout/crm/crm-whatsapp-unread-badge';
import { PerformanceWindowSelector } from '@/components/crm/performance-window-selector';
import { leadDatabaseSubtitle } from '@/lib/lead-display';
import { getPageMeta } from '@/lib/navigation';
import { cn } from '@/lib/cn';

type CrmTopbarProps = {
  staffUser: CrmStaffUser;
  whatsappSendsEnabled?: boolean;
};

function resolveSubtitle(
  pathname: string,
  leadTotal: number | null,
  renewalSubtitle: string | null,
  contactName: string | null,
  dashboardPeriodSubtitle: string | null,
  fallback?: string
) {
  if (pathname === '/' && dashboardPeriodSubtitle) {
    return dashboardPeriodSubtitle;
  }
  if (pathname.startsWith('/customers/') && contactName) {
    return contactName;
  }
  if ((pathname === '/database' || pathname.startsWith('/database/')) && leadTotal != null) {
    return leadDatabaseSubtitle(leadTotal);
  }
  if ((pathname === '/renewals' || pathname.startsWith('/renewals/')) && renewalSubtitle) {
    return renewalSubtitle;
  }
  return fallback;
}

export function CrmTopbar({ staffUser, whatsappSendsEnabled = false }: CrmTopbarProps) {
  const pathname = usePathname();
  const { contactName } = useCrmContactName();
  const { leadTotal } = useCrmLeadSummary();
  const { renewalSubtitle } = useCrmRenewalSummary();
  const { registration: dashboardFilter } = useCrmDashboardFilter();
  const { title, subtitle } = getPageMeta(pathname);
  const isDashboard = pathname === '/';
  const resolvedSubtitle = resolveSubtitle(
    pathname,
    leadTotal,
    renewalSubtitle,
    contactName,
    dashboardFilter?.periodSubtitle ?? null,
    subtitle
  );

  return (
    <header
      className={cn(CRM_HEADER_ROW_CLASS, 'gap-3 px-6', isDashboard && dashboardFilter && 'h-auto min-h-[72px] py-2.5')}
    >
      <div className="min-w-0 shrink-0">
        <h1 className="truncate text-lg leading-tight font-bold tracking-tight text-slate-800">{title}</h1>
        {resolvedSubtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{resolvedSubtitle}</p>}
      </div>

      {isDashboard && dashboardFilter ? (
        <div className="min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <PerformanceWindowSelector
            selected={dashboardFilter.selected}
            pending={dashboardFilter.pending}
            onChange={dashboardFilter.onChange}
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex shrink-0 items-center gap-3">
        <CrmWhatsAppUnreadBadge sendsEnabled={whatsappSendsEnabled} />
        <CrmUserMenu staffUser={staffUser} />
      </div>
    </header>
  );
}
