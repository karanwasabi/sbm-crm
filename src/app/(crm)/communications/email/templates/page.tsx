import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsTemplatesTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function EmailTemplatesPage() {
  const data = await loadCommsTemplatesTab('email');
  return <CommunicationsView {...data} />;
}
