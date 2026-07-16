import { CohortDetailView } from '@/components/views/cohort-detail-view';
import { getCohort, getCohortMembers, getProgramCohorts, listEmailTemplates, listStaff } from '@/utils/api';

export default async function CohortDetailPage({ params }: { params: Promise<{ cohortId: string }> }) {
  const { cohortId } = await params;

  let cohort: Awaited<ReturnType<typeof getCohort>> | null = null;
  let members: Awaited<ReturnType<typeof getCohortMembers>> = [];
  let transferTargets: Awaited<ReturnType<typeof getProgramCohorts>> = [];
  let coaches: Awaited<ReturnType<typeof listStaff>>['active'] = [];
  let emailTemplates: Awaited<ReturnType<typeof listEmailTemplates>> = [];

  try {
    const [cohortResult, membersResult, staff, templates] = await Promise.all([
      getCohort(cohortId),
      getCohortMembers(cohortId),
      listStaff(),
      listEmailTemplates().catch(() => []),
    ]);
    cohort = cohortResult;
    members = membersResult;
    coaches = staff.active.filter((row) => row.roles.includes('coach'));
    emailTemplates = templates;
    if (cohort.status === 'active') {
      const programCohorts = await getProgramCohorts(cohort.programId);
      transferTargets = programCohorts.filter((row) => row.status === 'active' && row.id !== cohortId);
    }
  } catch {
    cohort = null;
    members = [];
    transferTargets = [];
    coaches = [];
    emailTemplates = [];
  }

  if (!cohort) {
    return <div className="p-8 text-center text-sm text-slate-500">Cohort not found or you do not have access.</div>;
  }

  return (
    <CohortDetailView
      cohort={cohort}
      members={members}
      transferTargets={transferTargets}
      coaches={coaches}
      emailTemplates={emailTemplates}
    />
  );
}
