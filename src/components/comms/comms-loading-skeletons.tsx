import { BulkSendListSkeleton } from '@/components/comms/bulk-send-list-row-skeleton';
import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { Card } from '@/components/ui/card';

export function CommsHeaderStatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <CardSkeleton key={index} padding="sm">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-7 w-16" />
          <Skeleton className="mt-1.5 h-3 w-32" />
        </CardSkeleton>
      ))}
    </div>
  );
}

/** Full-panel skeleton used on first paint / hard navigations into Communications. */
export function CommsPanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-slate-200/90 bg-linear-to-r from-violet-100 via-indigo-100/80 to-emerald-100 px-4 py-3.5">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-40 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="p-5 md:p-7">
        <SectionHeadSkeleton />
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-28 rounded-2xl" />
          ))}
        </div>
        <div className="mt-4">
          <BulkSendListSkeleton rows={rows} />
        </div>
      </div>
    </Card>
  );
}

/** Table-only skeleton for template page / filter soft navigations — keeps nav chrome stable. */
export function CommsTemplatesTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="mb-3 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28 rounded-2xl" />
        ))}
      </div>
      <BulkSendListSkeleton rows={rows} />
    </div>
  );
}
