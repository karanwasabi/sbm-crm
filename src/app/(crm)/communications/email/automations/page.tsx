import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsAutomationsTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function EmailAutomationsPage() {
  const data = await loadCommsAutomationsTab('email');
  return <CommunicationsView {...data} tab="automations" />;
}
