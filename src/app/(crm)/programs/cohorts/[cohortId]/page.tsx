import { CohortDetailView } from '@/components/views/cohort-detail-view';
import { isSuperadmin } from '@/lib/access';
import { parseCohortMemberListQuery } from '@/lib/cohort-member-query';
import {
  getCohort,
  getCohortMembers,
  getMyAccess,
  getProgramCohorts,
  getWhatsAppFlags,
  listEmailTemplates,
  listStaff,
  listWhatsAppTemplates,
} from '@/utils/api';

export default async function CohortDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ cohortId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { cohortId } = await params;
  const listQuery = parseCohortMemberListQuery(await searchParams);

  let cohort: Awaited<ReturnType<typeof getCohort>> | null = null;
  let members: Awaited<ReturnType<typeof getCohortMembers>> = [];
  let transferTargets: Awaited<ReturnType<typeof getProgramCohorts>> = [];
  let coaches: Awaited<ReturnType<typeof listStaff>>['active'] = [];
  let emailTemplates: Awaited<ReturnType<typeof listEmailTemplates>> = [];
  let whatsappTemplates: Awaited<ReturnType<typeof listWhatsAppTemplates>> = [];
  let whatsappSendsEnabled = false;
  let canManagePointA = false;
  let canLockCohort = false;
  let isSuperadminUser = false;

  try {
    const [cohortResult, membersResult, staff, templates, whatsappTemplatesResult, access, whatsappFlags] =
      await Promise.all([
        getCohort(cohortId),
        getCohortMembers(cohortId),
        listStaff(),
        listEmailTemplates().catch(() => []),
        listWhatsAppTemplates().catch(() => []),
        getMyAccess(),
        getWhatsAppFlags().catch(() => ({ sendsEnabled: false, templatesEnabled: false })),
      ]);
    cohort = cohortResult;
    members = membersResult;
    coaches = staff.active.filter((row) => row.roles.includes('coach'));
    emailTemplates = templates;
    whatsappTemplates = whatsappTemplatesResult;
    whatsappSendsEnabled = whatsappFlags.sendsEnabled;
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
    whatsappTemplates = [];
    whatsappSendsEnabled = false;
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
      listQuery={listQuery}
      transferTargets={transferTargets}
      coaches={coaches}
      emailTemplates={emailTemplates}
      whatsappTemplates={whatsappTemplates}
      whatsappSendsEnabled={whatsappSendsEnabled}
      canManagePointA={canManagePointA}
      canLockCohort={canLockCohort}
      isSuperadmin={isSuperadminUser}
    />
  );
}
