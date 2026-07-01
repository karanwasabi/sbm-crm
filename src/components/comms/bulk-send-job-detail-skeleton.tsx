import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';

export function BulkSendJobDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <CardSkeleton>
        <SectionHeadSkeleton />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-40" />
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
      </CardSkeleton>

      <CardSkeleton>
        <SectionHeadSkeleton />
        <TableSkeleton columns={4} rows={6} embedded />
      </CardSkeleton>
    </div>
  );
}
