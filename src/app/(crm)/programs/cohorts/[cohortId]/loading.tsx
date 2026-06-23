import { CardSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';

export default function CohortDetailLoading() {
  return (
    <CrmPageSkeleton>
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <CardSkeleton key={index} padding="sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-16" />
          </CardSkeleton>
        ))}
      </div>
      <TableSkeleton columns={5} rows={4} />
    </CrmPageSkeleton>
  );
}
