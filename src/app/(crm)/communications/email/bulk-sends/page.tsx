import { CommunicationsView } from '@/components/views/communications-view';
import { loadCommsBulkSendsTab } from '@/app/(crm)/communications/_lib/comms-page-data';

export default async function EmailBulkSendsPage() {
  const data = await loadCommsBulkSendsTab('email');
  return <CommunicationsView {...data} />;
}
