'use client';

import { usePathname } from 'next/navigation';
import type { CrmStaffUser } from '@/components/layout/crm/crm-shell';
import { useCrmContactName } from '@/components/layout/crm/crm-contact-context';
import { CRM_HEADER_ROW_CLASS } from '@/components/layout/crm/crm-header-row';
import { useCrmLeadSummary } from '@/components/layout/crm/crm-lead-summary-context';
import { useCrmRenewalSummary } from '@/components/layout/crm/crm-renewal-summary-context';
import { CrmUserMenu } from '@/components/layout/crm/crm-user-menu';
import { CrmWhatsAppUnreadBadge } from '@/components/layout/crm/crm-whatsapp-unread-badge';
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
  fallback?: string
) {
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
  const { title, subtitle } = getPageMeta(pathname);
  const resolvedSubtitle = resolveSubtitle(pathname, leadTotal, renewalSubtitle, contactName, subtitle);

  return (
    <header className={cn(CRM_HEADER_ROW_CLASS, 'gap-4 px-6')}>
      <div className="min-w-0">
        <h1 className="truncate text-lg leading-tight font-bold tracking-tight text-slate-800">{title}</h1>
        {resolvedSubtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{resolvedSubtitle}</p>}
      </div>

      <div className="flex-1" />

      <CrmWhatsAppUnreadBadge sendsEnabled={whatsappSendsEnabled} />
      <CrmUserMenu staffUser={staffUser} />
    </header>
  );
}
