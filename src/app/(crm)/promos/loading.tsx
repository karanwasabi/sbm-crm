import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';

export default function PromosLoading() {
  return (
    <CrmPageSkeleton>
      <div className="flex items-center justify-between gap-4">
        <SectionHeadSkeleton className="mb-0" />
        <div className="h-9 w-36 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <CardSkeleton key={index} padding="none" className="overflow-hidden">
            <div className="border-l-4 border-slate-200 bg-gradient-to-r from-slate-50 via-white to-white px-5 py-3">
              <SectionHeadSkeleton className="mb-0" />
            </div>
            <TableSkeleton columns={7} rows={3} showHeader />
          </CardSkeleton>
        ))}
      </div>
    </CrmPageSkeleton>
  );
}
