import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { CommunicationsView } from '@/components/views/communications-view';
import { CommsHeaderStatsSlot } from '@/components/comms/comms-header-stats-loader';
import { CommsPanelSkeleton } from '@/components/comms/comms-loading-skeletons';
import { loadCommsTemplatesTab } from '@/app/(crm)/communications/_lib/comms-page-data';
import type { CommsChannel } from '@/lib/comms-channel';
import { buildCommsTemplatesHref, clampCommsTemplatePage } from '@/lib/comms-templates-query';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';

type SearchParams = Record<string, string | string[] | undefined>;

async function CommsTemplatesPanel({ channel, searchParams }: { channel: CommsChannel; searchParams: SearchParams }) {
  const data = await loadCommsTemplatesTab(channel, searchParams);
  const clampedPage = clampCommsTemplatePage(
    data.templateFilters.page,
    data.templatesTotal,
    data.templateFilters.pageSize
  );
  if (clampedPage !== data.templateFilters.page) {
    redirect(buildCommsTemplatesHref(data.templateFilters, { page: clampedPage }));
  }

  return <CommunicationsView {...data} panelOnly />;
}

/**
 * Templates tab entry: header KPIs stream independently of the templates panel
 * so page/filter changes only wait on the light paged templates API.
 */
export function CommsTemplatesPage({ channel, searchParams }: { channel: CommsChannel; searchParams: SearchParams }) {
  return (
    <CrmPageLayout className="gap-4">
      <CommsHeaderStatsSlot />
      <Suspense fallback={<CommsPanelSkeleton rows={8} />}>
        <CommsTemplatesPanel channel={channel} searchParams={searchParams} />
      </Suspense>
    </CrmPageLayout>
  );
}
