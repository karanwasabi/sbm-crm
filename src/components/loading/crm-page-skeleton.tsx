import type { ReactNode } from 'react';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

type CrmPageSkeletonProps = {
  children: ReactNode;
};

export function CrmPageSkeleton({ children }: CrmPageSkeletonProps) {
  return <CrmPageLayout>{children}</CrmPageLayout>;
}

export function GenericCrmPageSkeleton() {
  return (
    <CrmPageSkeleton>
      <CardSkeleton>
        <SectionHeadSkeleton />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardSkeleton>
    </CrmPageSkeleton>
  );
}

export function FilterBarSkeleton({ chips = 5 }: { chips?: number }) {
  return (
    <CardSkeleton padding="sm">
      <div className="flex flex-wrap items-center gap-2.5">
        {Array.from({ length: chips }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    </CardSkeleton>
  );
}
