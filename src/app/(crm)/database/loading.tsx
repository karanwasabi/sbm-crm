import { CrmPageSkeleton, FilterBarSkeleton } from '@/components/loading/crm-page-skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export default function DatabaseLoading() {
  return (
    <CrmPageSkeleton>
      <FilterBarSkeleton chips={7} />
      <div className="flex flex-wrap items-center gap-2.5">
        <Skeleton className="h-4 w-56" />
      </div>
      <TableSkeleton columns={8} rows={10} />
    </CrmPageSkeleton>
  );
}
