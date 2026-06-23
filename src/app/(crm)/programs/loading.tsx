import { CardSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export default function ProgramsLoading() {
  return (
    <CrmPageSkeleton>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <CardSkeleton padding="sm">
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-xl" />
            ))}
          </div>
        </CardSkeleton>
        <CardSkeleton padding="sm">
          <Skeleton className="mb-3 h-4 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </CardSkeleton>
      </div>
    </CrmPageSkeleton>
  );
}
