import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsPerformanceTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function WhatsAppPerformancePage() {
  const data = await loadCommsPerformanceTab('whatsapp');
  return <CommunicationsView {...data} tab="performance" />;
}
