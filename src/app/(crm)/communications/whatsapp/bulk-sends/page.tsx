import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsBulkSendsTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function WhatsAppBulkSendsPage() {
  const data = await loadCommsBulkSendsTab('whatsapp');
  return <CommunicationsView {...data} tab="bulk-sends" />;
}
