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

export function FilterBarSkeleton({ chips = 8 }: { chips?: number }) {
  return (
    <CardSkeleton padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-canvas-cool px-4 py-3">
        <Skeleton className="h-9 w-52 rounded-2xl" />
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-2xl" />
        ))}
      </div>
      <div className="bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-10" />
          <div className="flex flex-1 gap-1.5 overflow-hidden">
            {Array.from({ length: chips }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-20 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </CardSkeleton>
  );
}
