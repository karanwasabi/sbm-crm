import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { CrmPageSkeleton } from '@/components/loading/crm-page-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';

export function LeadIntakeTabBarSkeleton() {
  return (
    <div className="flex gap-1 rounded-2xl border border-slate-100 bg-white p-1">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-9 w-28 rounded-[14px]" />
      ))}
    </div>
  );
}

export function ManualLeadTabSkeleton() {
  return (
    <CardSkeleton className="max-w-3xl">
      <SectionHeadSkeleton />
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
  );
}

export function IntakeFormsTabSkeleton() {
  return (
    <CardSkeleton className="max-w-4xl">
      <SectionHeadSkeleton />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-2xl border border-slate-100 bg-white p-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-16 rounded-[14px]" />
          ))}
        </div>
        <Skeleton className="h-10 w-28 rounded-2xl" />
      </div>
      <TableSkeleton columns={4} rows={5} showHeader className="border-0 shadow-none" />
    </CardSkeleton>
  );
}

export function MetaIntakeTabSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <CardSkeleton>
        <SectionHeadSkeleton />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </CardSkeleton>
      <CardSkeleton padding="none" className="overflow-hidden">
        <div className="p-5">
          <SectionHeadSkeleton />
        </div>
        <TableSkeleton columns={4} rows={4} showHeader className="border-0 shadow-none" />
      </CardSkeleton>
    </div>
  );
}

function resolveSkeletonTab(tab?: string | null) {
  if (tab === 'intake-forms') return 'intake-forms' as const;
  if (tab === 'integrations' || tab === 'meta') return 'integrations' as const;
  return 'manual' as const;
}

export function LeadIntakePageSkeleton({ tab }: { tab?: string | null }) {
  const active = resolveSkeletonTab(tab);

  return (
    <CrmPageSkeleton>
      <LeadIntakeTabBarSkeleton />
      <div className="mt-4">
        {active === 'intake-forms' ? (
          <IntakeFormsTabSkeleton />
        ) : active === 'integrations' ? (
          <MetaIntakeTabSkeleton />
        ) : (
          <ManualLeadTabSkeleton />
        )}
      </div>
    </CrmPageSkeleton>
  );
}
