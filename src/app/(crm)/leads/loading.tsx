import { CardSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export default function LeadsLoading() {
  return (
    <CrmPageSkeleton>
      <CardSkeleton>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        <Skeleton className="mt-4 h-10 w-32 rounded-2xl" />
      </CardSkeleton>
    </CrmPageSkeleton>
  );
}
