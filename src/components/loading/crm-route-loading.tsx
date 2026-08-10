'use client';

import { usePathname } from 'next/navigation';
import { DashboardPageSkeleton } from '@/components/loading/dashboard-page-skeleton';
import { GenericCrmPageSkeleton } from '@/components/loading/crm-page-skeleton';

export function CrmRouteLoading() {
  const pathname = usePathname();

  if (pathname === '/') {
    return <DashboardPageSkeleton />;
  }

  return <GenericCrmPageSkeleton />;
}
