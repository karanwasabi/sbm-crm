import { redirect } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { ResourceManagerView } from '@/components/views/resource-manager-view';
import { isSuperadmin } from '@/lib/access';
import { getMyAccess, listAdminResourceCohortOptions, listAdminResources } from '@/utils/api';

export default async function ResourcesPage() {
  const access = await getMyAccess();
  if (!isSuperadmin(access.roles)) {
    redirect('/unauthorized');
  }

  const [resources, programCohorts] = await Promise.all([
    listAdminResources().catch(() => []),
    listAdminResourceCohortOptions().catch(() => []),
  ]);

  return (
    <CrmPageLayout>
      <ResourceManagerView resources={resources} programCohorts={programCohorts} />
    </CrmPageLayout>
  );
}
