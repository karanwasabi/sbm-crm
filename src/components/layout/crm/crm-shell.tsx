'use client';

import type { ReactNode } from 'react';
import { CrmSidebar } from '@/components/layout/crm/crm-sidebar';
import { CrmTopbar } from '@/components/layout/crm/crm-topbar';

type CrmShellProps = {
  children: ReactNode;
};

export function CrmShell({ children }: CrmShellProps) {
  return (
    <div className="flex h-dvh min-w-0 bg-white">
      <CrmSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <CrmTopbar />
        <div className="flex flex-1 flex-col overflow-auto bg-canvas [scrollbar-gutter:stable]">{children}</div>
      </div>
    </div>
  );
}
