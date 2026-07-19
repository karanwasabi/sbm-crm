import { redirect } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { PushNotificationsView } from '@/components/views/push-notifications-view';
import { isSuperadmin } from '@/lib/access';
import { getMyAccess, listCohortPushAssignments, listPushTemplates } from '@/utils/api';

export default async function PushNotificationsPage() {
  const access = await getMyAccess();
  if (!isSuperadmin(access.roles)) {
    redirect('/unauthorized');
  }

  const [templates, assignments] = await Promise.all([
    listPushTemplates().catch(() => []),
    listCohortPushAssignments().catch(() => []),
  ]);

  return (
    <CrmPageLayout>
      <PushNotificationsView templates={templates} assignments={assignments} />
    </CrmPageLayout>
  );
}
