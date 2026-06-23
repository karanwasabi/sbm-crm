import { DashboardView } from '@/components/views/dashboard-view';
import { getMetaIntegrationStatus, getSourcePerformance } from '@/utils/api';
import type { MetaIntegrationStatus, SourcePerformanceRow } from '@/types/crm';

const EMPTY_STATUS: MetaIntegrationStatus = {
  connected: false,
  provider: null,
  webhookConfigured: false,
  webhookUrl: '',
  leadsToday: 0,
  lastSyncAt: null,
  metaLeadsTotal: 0,
  metaLeads7d: 0,
};

export default async function DashboardPage() {
  let integrationStatus = EMPTY_STATUS;
  let sourcePerformance: SourcePerformanceRow[] = [];

  try {
    [integrationStatus, sourcePerformance] = await Promise.all([getMetaIntegrationStatus(), getSourcePerformance()]);
  } catch {
    integrationStatus = EMPTY_STATUS;
    sourcePerformance = [];
  }

  return <DashboardView integrationStatus={integrationStatus} sourcePerformance={sourcePerformance} />;
}
