import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';

export default function PushNotificationsLoading() {
  return (
    <CrmPageSkeleton>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <CardSkeleton key={index} className="min-h-[100px]">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </CardSkeleton>
        ))}
      </div>
      <CardSkeleton padding="none" className="overflow-hidden">
        <div className="p-5">
          <SectionHeadSkeleton />
        </div>
        <TableSkeleton columns={6} rows={5} showHeader />
      </CardSkeleton>
    </CrmPageSkeleton>
  );
}
