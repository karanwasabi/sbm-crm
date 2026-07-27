import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsAutomationsTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function WhatsAppAutomationsPage() {
  const data = await loadCommsAutomationsTab('whatsapp');
  return <CommunicationsView {...data} tab="automations" />;
}
