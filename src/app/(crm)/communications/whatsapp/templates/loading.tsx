import { CommsHeaderStatsSlot } from '@/components/comms/comms-header-stats-loader';
import { CommsPanelSkeleton } from '@/components/comms/comms-loading-skeletons';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';

/** Soft page/filter nav: stream KPIs; only the templates panel shows a skeleton. */
export default function WhatsAppTemplatesLoading() {
  return (
    <CrmPageLayout className="gap-4">
      <CommsHeaderStatsSlot />
      <CommsPanelSkeleton rows={8} />
    </CrmPageLayout>
  );
}
