import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsBulkSendsTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function CommunicationsBulkSendsPage() {
  const data = await loadCommsBulkSendsTab();

  return <CommunicationsView {...data} tab="bulk-sends" />;
}
