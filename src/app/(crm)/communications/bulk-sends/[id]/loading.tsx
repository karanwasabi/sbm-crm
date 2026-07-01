import { BulkSendJobDetailSkeleton } from '@/components/comms/bulk-send-job-detail-skeleton';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { Skeleton } from '@/components/loading/skeleton';

export default function BulkSendJobLoading() {
  return (
    <CrmPageLayout className="gap-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
      <BulkSendJobDetailSkeleton />
    </CrmPageLayout>
  );
}
