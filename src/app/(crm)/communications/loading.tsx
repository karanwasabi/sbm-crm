import { CommsHeaderStatsSkeleton, CommsPanelSkeleton } from '@/components/comms/comms-loading-skeletons';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';

export default function CommunicationsLoading() {
  return (
    <CrmPageLayout className="gap-4">
      <CommsHeaderStatsSkeleton />
      <CommsPanelSkeleton />
    </CrmPageLayout>
  );
}
