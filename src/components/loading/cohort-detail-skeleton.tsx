import { CardSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';

export function CohortDetailSkeleton() {
  return (
    <CrmPageSkeleton>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      <div className="overflow-hidden rounded-[28px] border-b-[6px] border-slate-300 bg-linear-to-br from-slate-400 via-slate-500 to-slate-600 px-6 py-6 shadow-[0_12px_30px_-8px_rgba(15,23,42,0.25)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-8 w-40 bg-white/30" />
              <Skeleton className="h-6 w-24 rounded-full bg-white/25" />
            </div>
            <Skeleton className="h-3.5 w-56 bg-white/25" />
            <Skeleton className="h-3.5 w-36 bg-white/20" />
          </div>
          <div className="inline-flex overflow-hidden rounded-2xl border border-white/20 bg-black/20">
            <div className="px-5 py-3">
              <Skeleton className="mx-auto h-7 w-10 bg-white/30" />
              <Skeleton className="mt-1.5 h-2.5 w-12 bg-white/20" />
            </div>
            <div className="border-l border-white/15 px-5 py-3">
              <Skeleton className="mx-auto h-7 w-10 bg-white/30" />
              <Skeleton className="mt-1.5 h-2.5 w-12 bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      <CardSkeleton padding="sm" className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-36 rounded-full" />
      </CardSkeleton>

      <CardSkeleton padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-canvas-cool px-4 py-3">
          <Skeleton className="h-9 w-56 rounded-2xl" />
          <Skeleton className="h-9 w-24 rounded-2xl" />
          <Skeleton className="h-9 w-24 rounded-2xl" />
          <Skeleton className="h-9 w-24 rounded-2xl" />
        </div>
        <TableSkeleton columns={8} rows={8} embedded />
      </CardSkeleton>
    </CrmPageSkeleton>
  );
}
