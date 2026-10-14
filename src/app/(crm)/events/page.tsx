import { redirect } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { EventsListView } from '@/components/views/events-list-view';
import { isSuperadmin } from '@/lib/access';
import { getMyAccess, listEvents } from '@/utils/api';

export default async function EventsPage() {
  const access = await getMyAccess();
  if (!isSuperadmin(access.roles)) {
    redirect('/unauthorized');
  }

  const events = await listEvents().catch(() => []);

  return (
    <CrmPageLayout>
      <EventsListView events={events} />
    </CrmPageLayout>
  );
}
