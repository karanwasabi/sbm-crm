import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { CardSkeleton } from '@/components/loading/card-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';
import { DASHBOARD_CHART_MIN_HEIGHT } from '@/components/crm/charts/dashboard-chart-card';

function KpiStripSkeleton() {
  return (
    <CardSkeleton padding="none" className="overflow-hidden">
      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex min-h-30 flex-col items-center justify-center gap-2 px-5 py-5 sm:px-6">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </CardSkeleton>
  );
}

function ChartCardSkeleton() {
  return (
    <CardSkeleton className={DASHBOARD_CHART_MIN_HEIGHT}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex min-h-[148px] flex-1 flex-col justify-end gap-3">
        <div className="flex h-[120px] items-end gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="flex-1 rounded-t-md" style={{ height: `${40 + (index % 4) * 18}px` }} />
          ))}
        </div>
        <div className="grid grid-cols-8 gap-1 border-t border-slate-100 pt-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="mx-auto h-2 w-full max-w-10" />
          ))}
        </div>
      </div>
    </CardSkeleton>
  );
}

function OverviewSectionSkeleton() {
  return (
    <CardSkeleton padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-1.5 h-3 w-48" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3 lg:items-stretch">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </CardSkeleton>
  );
}

function PerformanceTableSkeleton() {
  return (
    <CardSkeleton padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-1.5 h-3 w-56" />
        </div>
        <Skeleton className="h-9 w-64 rounded-2xl" />
      </div>
      <TableSkeleton embedded showHeader={false} columns={7} rows={6} />
    </CardSkeleton>
  );
}

export function DashboardFilteredContentSkeleton() {
  return (
    <>
      <OverviewSectionSkeleton />
      <PerformanceTableSkeleton />
      <PerformanceTableSkeleton />
      <PerformanceTableSkeleton />
    </>
  );
}

type DashboardPageSkeletonProps = {
  includeKpis?: boolean;
};

export function DashboardPageSkeleton({ includeKpis = true }: DashboardPageSkeletonProps) {
  return (
    <CrmPageLayout className="gap-4.5">
      {includeKpis ? <KpiStripSkeleton /> : null}
      <DashboardFilteredContentSkeleton />
    </CrmPageLayout>
  );
}
