import { CohortCardGrid } from '@/components/crm/cohort-card-grid';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { SectionHead } from '@/components/ui/section-head';
import type { CohortSummary } from '@/types/crm';

type ProgramsViewProps = {
  programName: string;
  cohorts: CohortSummary[];
};

export function ProgramsView({ programName, cohorts }: ProgramsViewProps) {
  return (
    <CrmPageLayout>
      <SectionHead
        title={programName}
        subtitle="Cohort queue, enrollment targets, and active phases"
        className="mb-4"
      />
      <CohortCardGrid cohorts={cohorts} />
    </CrmPageLayout>
  );
}
