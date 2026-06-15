'use client';

import type { ReactNode } from 'react';
import { CrmSidebar } from '@/components/layout/crm/crm-sidebar';
import { CrmTopbar } from '@/components/layout/crm/crm-topbar';

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
    <div className="flex h-dvh min-w-0 bg-white">
      <CrmSidebar staffUser={staffUser} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CrmTopbar />
        <div className="flex flex-1 flex-col overflow-auto bg-canvas [scrollbar-gutter:stable]">{children}</div>
      </div>
    </div>
  );
}
