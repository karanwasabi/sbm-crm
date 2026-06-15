'use client';

import type { ReactNode } from 'react';
import { CrmSidebar } from '@/components/layout/crm/crm-sidebar';
import { CrmTopbar } from '@/components/layout/crm/crm-topbar';
import { ToastProvider } from '@/components/ui/toast';

export type CrmStaffUser = {
  email: string;
  initials: string;
  roleLabel: string;
};

type CrmShellProps = {
  children: ReactNode;
  staffUser: CrmStaffUser;
};

export function CrmShell({ children, staffUser }: CrmShellProps) {
  return (
    <ToastProvider>
      <div className="flex h-dvh min-w-0 bg-white">
        <CrmSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <CrmTopbar staffUser={staffUser} />
          <div className="flex flex-1 [scrollbar-gutter:stable] flex-col overflow-auto bg-canvas">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
