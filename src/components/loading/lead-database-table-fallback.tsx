import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export function LeadDatabaseTableFallback() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <Skeleton className="h-4 w-56" />
      </div>
      <TableSkeleton columns={11} rows={10} />
      <Skeleton className="h-9 w-48" />
    </>
  );
}

export function DatabaseLoading() {
  return (
    <CrmPageSkeleton>
      <LeadDatabaseTableFallback />
    </CrmPageSkeleton>
  );
}
