import { BulkSendListSkeleton } from '@/components/comms/bulk-send-list-row-skeleton';
import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export default function CommunicationsLoading() {
  return (
    <CrmPageSkeleton>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} padding="sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-16" />
            <Skeleton className="mt-1.5 h-3 w-32" />
          </CardSkeleton>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <CardSkeleton>
        <SectionHeadSkeleton />
        <BulkSendListSkeleton rows={5} />
      </CardSkeleton>
    </CrmPageSkeleton>
  );
}
