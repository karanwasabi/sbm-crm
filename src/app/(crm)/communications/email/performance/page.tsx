import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsPerformanceTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function EmailPerformancePage() {
  const data = await loadCommsPerformanceTab('email');
  return <CommunicationsView {...data} tab="performance" />;
}
