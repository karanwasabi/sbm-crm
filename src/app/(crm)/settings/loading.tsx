import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export default function SettingsLoading() {
  return (
    <CrmPageSkeleton>
      <div className="flex gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28 rounded-2xl" />
        ))}
      </div>
      <CardSkeleton>
        <SectionHeadSkeleton />
        <TableSkeleton columns={4} rows={5} className="border-0 shadow-none" />
      </CardSkeleton>
    </CrmPageSkeleton>
  );
}
