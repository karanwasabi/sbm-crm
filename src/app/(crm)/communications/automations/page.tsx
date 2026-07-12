import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsAutomationsTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function CommunicationsAutomationsPage() {
  const data = await loadCommsAutomationsTab();

  return <CommunicationsView {...data} tab="automations" />;
}
