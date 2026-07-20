import { CohortDetailView } from '@/components/views/cohort-detail-view';
import { isSuperadmin } from '@/lib/access';
import {
  getCohort,
  getCohortMembers,
  getMyAccess,
  getProgramCohorts,
  listEmailTemplates,
  listStaff,
} from '@/utils/api';

export default async function CohortDetailPage({ params }: { params: Promise<{ cohortId: string }> }) {
  const { cohortId } = await params;

  let cohort: Awaited<ReturnType<typeof getCohort>> | null = null;
  let members: Awaited<ReturnType<typeof getCohortMembers>> = [];
  let transferTargets: Awaited<ReturnType<typeof getProgramCohorts>> = [];
  let coaches: Awaited<ReturnType<typeof listStaff>>['active'] = [];
  let emailTemplates: Awaited<ReturnType<typeof listEmailTemplates>> = [];
  let canManagePointA = false;
  let canLockCohort = false;
  let isSuperadminUser = false;

  try {
    const [cohortResult, membersResult, staff, templates, access] = await Promise.all([
      getCohort(cohortId),
      getCohortMembers(cohortId),
      listStaff(),
      listEmailTemplates().catch(() => []),
      getMyAccess(),
    ]);
    cohort = cohortResult;
    members = membersResult;
    coaches = staff.active.filter((row) => row.roles.includes('coach'));
    emailTemplates = templates;
    const superadmin = isSuperadmin(access.roles);
    canManagePointA = superadmin;
    canLockCohort = superadmin;
    isSuperadminUser = superadmin;
    const canTransferFrom =
      cohort.status === 'active' || (superadmin && (cohort.status === 'upcoming' || cohort.status === 'locked'));
    if (canTransferFrom) {
      const programCohorts = await getProgramCohorts(cohort.programId);
      transferTargets = programCohorts.filter((row) => {
        if (row.id === cohortId) return false;
        if (superadmin) {
          return row.status === 'active' || row.status === 'upcoming' || row.status === 'locked';
        }
        return row.status === 'active';
      });
    }
  } catch {
    cohort = null;
    members = [];
    transferTargets = [];
    coaches = [];
    emailTemplates = [];
    canManagePointA = false;
    canLockCohort = false;
    isSuperadminUser = false;
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
      canManagePointA={canManagePointA}
      canLockCohort={canLockCohort}
      isSuperadmin={isSuperadminUser}
    />
  );
}
