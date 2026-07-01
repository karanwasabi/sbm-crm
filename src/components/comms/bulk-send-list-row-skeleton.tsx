import { Skeleton } from '@/components/loading/skeleton';

export function BulkSendListRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-canvas-cool px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function BulkSendListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, index) => (
        <BulkSendListRowSkeleton key={index} />
      ))}
    </div>
  );
}

export function BulkSendPreviewSkeleton() {
  return (
    <div className="mt-4 space-y-2.5 rounded-2xl border border-slate-200 bg-canvas-cool px-4 py-3">
      <Skeleton className="h-3.5 w-44" />
      <Skeleton className="h-3 w-64" />
    </div>
  );
}
