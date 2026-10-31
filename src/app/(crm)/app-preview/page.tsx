import { redirect } from 'next/navigation';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { AppPreviewView } from '@/components/views/app-preview-view';
import { isSuperadmin } from '@/lib/access';
import { getMyAccess, getProgramCohorts, listPrograms } from '@/utils/api';
import type { CohortSummary } from '@/types/crm';

export default async function AppPreviewPage() {
  const access = await getMyAccess();
  if (!isSuperadmin(access.roles)) {
    redirect('/unauthorized');
  }

  let cohorts: CohortSummary[] = [];
  try {
    const programs = await listPrograms();
    const takeControl = programs.find((program) => program.slug === 'take-control');
    if (takeControl) {
      cohorts = await getProgramCohorts(takeControl.id);
    }
  } catch {
    cohorts = [];
  }

  return (
    <CrmPageLayout>
      <AppPreviewView cohorts={cohorts} />
    </CrmPageLayout>
  );
}
