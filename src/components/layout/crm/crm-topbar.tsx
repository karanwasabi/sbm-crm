'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { CrmStaffUser } from '@/components/layout/crm/crm-shell';
import { useCrmContactName } from '@/components/layout/crm/crm-contact-context';
import { CRM_HEADER_ROW_CLASS } from '@/components/layout/crm/crm-header-row';
import { useCrmLeadSummary } from '@/components/layout/crm/crm-lead-summary-context';
import { useCrmRenewalSummary } from '@/components/layout/crm/crm-renewal-summary-context';
import { CrmUserMenu } from '@/components/layout/crm/crm-user-menu';
import { CrmWhatsAppUnreadBadge } from '@/components/layout/crm/crm-whatsapp-unread-badge';
import { Button } from '@/components/ui/button';
import { leadDatabaseSubtitle } from '@/lib/lead-display';
import { getPageMeta } from '@/lib/navigation';
import { cn } from '@/lib/cn';

type CrmTopbarProps = {
  staffUser: CrmStaffUser;
  whatsappSendsEnabled?: boolean;
  onOpenNav?: () => void;
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

export function CrmTopbar({ staffUser, whatsappSendsEnabled = false, onOpenNav }: CrmTopbarProps) {
  const pathname = usePathname();
  const { contactName } = useCrmContactName();
  const { leadTotal } = useCrmLeadSummary();
  const { renewalSubtitle } = useCrmRenewalSummary();
  const { title, subtitle } = getPageMeta(pathname);
  const resolvedSubtitle = resolveSubtitle(pathname, leadTotal, renewalSubtitle, contactName, subtitle);

  return (
    <header className={cn(CRM_HEADER_ROW_CLASS, 'gap-3 px-4 lg:gap-4 lg:px-6')}>
      {onOpenNav ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-11 w-11 shrink-0 p-0 lg:hidden"
          onClick={onOpenNav}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      ) : null}

      <div className="min-w-0">
        <h1 className="truncate text-base leading-tight font-bold tracking-tight text-slate-800 lg:text-lg">{title}</h1>
        {resolvedSubtitle ? <p className="mt-0.5 truncate text-xs text-slate-500">{resolvedSubtitle}</p> : null}
      </div>

      <div className="flex-1" />

      <CrmWhatsAppUnreadBadge sendsEnabled={whatsappSendsEnabled} />
      <CrmUserMenu staffUser={staffUser} />
    </header>
  );
}
