import { Suspense } from 'react';
import { loadCommsHeaderData } from '@/app/(crm)/communications/_lib/comms-page-data';
import { CommsHeaderStatsClient } from '@/components/comms/comms-header-stats-client';
import { CommsHeaderStatsSkeleton } from '@/components/comms/comms-loading-skeletons';

async function CommsHeaderStatsAsync() {
  const header = await loadCommsHeaderData();
  return (
    <CommsHeaderStatsClient marketingSummary={header.marketingSummary} analyticsSummary={header.analyticsSummary} />
  );
}

/** Streams header KPIs independently of the templates/content panel. */
export function CommsHeaderStatsSlot() {
  return (
    <Suspense fallback={<CommsHeaderStatsSkeleton />}>
      <CommsHeaderStatsAsync />
    </Suspense>
  );
}
