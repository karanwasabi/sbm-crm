'use client';

import type { ReactNode } from 'react';
import { CrmContactProvider } from '@/components/layout/crm/crm-contact-context';
import { CrmLeadSummaryProvider } from '@/components/layout/crm/crm-lead-summary-context';
import { CrmRenewalSummaryProvider } from '@/components/layout/crm/crm-renewal-summary-context';
import { CrmSidebar } from '@/components/layout/crm/crm-sidebar';
import { CrmProfileProvider } from '@/components/layout/crm/crm-profile-context';
import { CrmTopbar } from '@/components/layout/crm/crm-topbar';
import { ToastProvider } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Profile } from '@/types/profile';

export type CrmStaffUser = {
  email: string;
  initials: string;
  roleLabel: string;
};

type CrmShellProps = {
  children: ReactNode;
  staffUser: CrmStaffUser;
  profile: Profile | null;
  profileError: string | null;
  isSuperadmin?: boolean;
  isMarketing?: boolean;
  whatsappSendsEnabled?: boolean;
};

export function CrmShell({
  children,
  staffUser,
  profile,
  profileError,
  isSuperadmin = false,
  isMarketing = false,
  whatsappSendsEnabled = false,
}: CrmShellProps) {
  return (
    <ToastProvider>
      <TooltipProvider>
        <CrmContactProvider>
          <CrmLeadSummaryProvider>
            <CrmRenewalSummaryProvider>
              <CrmProfileProvider profile={profile} profileError={profileError} roleLabel={staffUser.roleLabel}>
                <div className="flex h-dvh min-w-0 bg-white">
                  <CrmSidebar isSuperadmin={isSuperadmin} isMarketing={isMarketing} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <CrmTopbar staffUser={staffUser} whatsappSendsEnabled={whatsappSendsEnabled} />
                    <div className="flex flex-1 [scrollbar-gutter:stable] flex-col overflow-auto bg-canvas">
                      {children}
                    </div>
                  </div>
                </div>
              </CrmProfileProvider>
            </CrmRenewalSummaryProvider>
          </CrmLeadSummaryProvider>
        </CrmContactProvider>
      </TooltipProvider>
    </ToastProvider>
  );
}
