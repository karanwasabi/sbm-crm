import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';

export default function RenewalsLoading() {
  return (
    <CrmPageSkeleton>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} className="min-h-[130px]">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </CardSkeleton>
        ))}
      </div>
      <CardSkeleton padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-canvas-cool px-4 py-3">
          <Skeleton className="h-10 w-full max-w-96 rounded-2xl" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-24 rounded-2xl" />
          ))}
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </CardSkeleton>
      <CardSkeleton padding="none" className="overflow-hidden">
        <div className="p-5">
          <SectionHeadSkeleton />
        </div>
        <TableSkeleton columns={7} rows={5} showHeader />
      </CardSkeleton>
    </CrmPageSkeleton>
  );
}
