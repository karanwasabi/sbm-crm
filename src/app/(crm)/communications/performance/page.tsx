import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsPerformanceTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function CommunicationsPerformancePage() {
  const data = await loadCommsPerformanceTab();

  return <CommunicationsView {...data} tab="performance" />;
}
