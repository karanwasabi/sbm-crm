import { CardSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export default function ProgramsLoading() {
  return (
    <CrmPageSkeleton>
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="mb-3 h-5 w-32" />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <CardSkeleton key={index} padding="sm">
                <Skeleton className="mb-2 h-4 w-28" />
                <Skeleton className="mb-4 h-3 w-20" />
                <Skeleton className="h-7 w-12" />
              </CardSkeleton>
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="mb-3 h-5 w-36" />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <CardSkeleton key={`test-${index}`} padding="sm">
                <Skeleton className="mb-2 h-4 w-28" />
                <Skeleton className="mb-4 h-3 w-20" />
                <Skeleton className="h-7 w-12" />
              </CardSkeleton>
            ))}
          </div>
        </div>
      </div>
    </CrmPageSkeleton>
  );
}
