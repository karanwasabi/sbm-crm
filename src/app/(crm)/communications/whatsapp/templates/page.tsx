import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsTemplatesTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function WhatsAppTemplatesPage() {
  const data = await loadCommsTemplatesTab('whatsapp');
  return <CommunicationsView {...data} tab="templates" />;
}
