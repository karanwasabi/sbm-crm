import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';

export default function CohortDetailLoading() {
  return (
    <CrmPageSkeleton>
      <Skeleton className="mb-4 h-4 w-32" />
      <Skeleton className="mb-5 h-36 w-full rounded-[28px]" />
      <TableSkeleton columns={5} rows={4} />
    </CrmPageSkeleton>
  );
}
