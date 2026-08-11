import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';

export default function ResourcesLoading() {
  return (
    <CrmPageSkeleton>
      <div className="flex items-center gap-3 border-b border-slate-100 px-1 pb-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <CardSkeleton padding="none" className="overflow-hidden">
        <div className="p-5">
          <SectionHeadSkeleton />
        </div>
        <TableSkeleton columns={5} rows={8} showHeader />
      </CardSkeleton>
    </CrmPageSkeleton>
  );
}
