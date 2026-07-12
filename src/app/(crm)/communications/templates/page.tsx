import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsTemplatesTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function CommunicationsTemplatesPage() {
  const data = await loadCommsTemplatesTab();

  return <CommunicationsView {...data} tab="templates" />;
}
