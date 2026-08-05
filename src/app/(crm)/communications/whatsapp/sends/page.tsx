import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsSendsTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function WhatsAppSendsPage() {
  const data = await loadCommsSendsTab();
  return <CommunicationsView {...data} />;
}
