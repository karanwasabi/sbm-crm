import { redirect } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { ResourceManagerView } from '@/components/views/resource-manager-view';
import { isSuperadmin } from '@/lib/access';
import { getMyAccess, getProgramCohorts, listAdminResources, listPrograms } from '@/utils/api';

export default async function ResourcesPage() {
  const access = await getMyAccess();
  if (!isSuperadmin(access.roles)) {
    redirect('/unauthorized');
  }

  const [resources, programs] = await Promise.all([
    listAdminResources().catch(() => []),
    listPrograms().catch(() => []),
  ]);

  const programCohorts = await Promise.all(
    programs.map(async (program) => {
      const cohorts = await getProgramCohorts(program.id).catch(() => []);
      return {
        id: program.id,
        name: program.name,
        cohorts: cohorts.map((cohort) => ({
          id: cohort.id,
          name: cohort.name,
          startsOn: cohort.startsOn,
        })),
      };
    })
  );

  return (
    <CrmPageLayout>
      <ResourceManagerView resources={resources} programCohorts={programCohorts} />
    </CrmPageLayout>
  );
}
