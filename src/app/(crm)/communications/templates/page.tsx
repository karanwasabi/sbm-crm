import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommunicationsPageData } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function CommunicationsTemplatesPage() {
  const data = await loadCommunicationsPageData();

  return <CommunicationsView {...data} tab="templates" />;
}
