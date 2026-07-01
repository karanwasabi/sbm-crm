import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { CardSkeleton, SectionHeadSkeleton } from '@/components/loading/card-skeleton';
import { Skeleton } from '@/components/loading/skeleton';
import { TableSkeleton } from '@/components/loading/table-skeleton';

export function EmailTemplateEditorSkeleton() {
  return (
    <CardSkeleton padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-canvas-cool px-4 py-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-20 rounded-lg" />
        ))}
        <Skeleton className="ml-auto h-8 w-28 rounded-lg" />
      </div>
      <Skeleton className="h-[720px] w-full rounded-none" />
    </CardSkeleton>
  );
}

export function EmailTemplatePageSkeleton({ showBack = false }: { showBack?: boolean }) {
  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-48" />
        {showBack ? <Skeleton className="h-8 w-16 rounded-full" /> : null}
      </div>
      <CardSkeleton className="gap-4 p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full max-w-xs rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </CardSkeleton>
      <EmailTemplateEditorSkeleton />
    </CrmPageLayout>
  );
}

export function AutomationBuilderSkeleton() {
  return (
    <CardSkeleton padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-canvas-cool px-4 py-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[560px] w-full rounded-none" />
    </CardSkeleton>
  );
}

export function AutomationPageSkeleton({ showEnrollments = false }: { showEnrollments?: boolean }) {
  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
      <AutomationBuilderSkeleton />
      {showEnrollments ? (
        <CardSkeleton className="p-4">
          <SectionHeadSkeleton />
          <TableSkeleton columns={6} rows={5} embedded />
        </CardSkeleton>
      ) : null}
    </CrmPageLayout>
  );
}

export function PurgeAuditDetailSkeleton() {
  return (
    <>
      <div className="border-b border-slate-100 px-6 py-5 pr-12">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="space-y-4 px-6 py-5">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <div className="rounded-xl border border-slate-100 bg-canvas-cool/60 p-3">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="mt-2 h-3.5 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ChangePasswordFormSkeleton() {
  return (
    <CrmPageLayout className="gap-4">
      <Skeleton className="h-4 w-28" />
      <CardSkeleton>
        <SectionHeadSkeleton />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </CardSkeleton>
    </CrmPageLayout>
  );
}
