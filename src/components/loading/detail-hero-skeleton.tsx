import { CardSkeleton } from '@/components/loading/card-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export function DetailHeroSkeleton() {
  return (
    <CardSkeleton padding="none" className="overflow-hidden">
      <div className="border-l-4 border-slate-200 bg-gradient-to-r from-slate-50 via-white to-white px-6 py-6 lg:px-8 lg:py-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-2/3 max-w-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-28 rounded-2xl" />
          </div>
        </div>
      </div>
    </CardSkeleton>
  );
}

export function StatTilesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} padding="sm">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-8 w-16" />
        </CardSkeleton>
      ))}
    </div>
  );
}
