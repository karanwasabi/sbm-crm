import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';

export default function SettingsLoading() {
  return (
    <CrmPageSkeleton>
      <div className="flex gap-1 rounded-2xl border border-slate-100 bg-white p-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28 rounded-[14px]" />
        ))}
      </div>
      <CardSkeleton>
        <SectionHeadSkeleton />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </CardSkeleton>
    </CrmPageSkeleton>
  );
}
