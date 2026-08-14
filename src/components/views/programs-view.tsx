import { CohortCardGrid } from '@/components/crm/cohort-card-grid';
import { CrmPageLayout } from '@/components/layout/crm/crm-page-layout';
import { SectionHead } from '@/components/ui/section-head';
import { partitionCohorts } from '@/lib/cohort-display';
import type { CohortSummary } from '@/types/crm';

type ProgramsViewProps = {
  programName: string;
  cohorts: CohortSummary[];
};

export function ProgramsView({ programName, cohorts }: ProgramsViewProps) {
  const { live, test } = partitionCohorts(cohorts);

  return (
    <CrmPageLayout>
      <SectionHead
        title={programName}
        subtitle="Cohort queue, enrollment targets, and active phases"
        className="mb-4"
      />
      {live.length === 0 && test.length === 0 ? (
        <CohortCardGrid cohorts={[]} />
      ) : (
        <div className="flex flex-col gap-8">
          {live.length > 0 ? (
            <section>
              <SectionHead title="Live cohorts" subtitle={`${live.length} live`} className="mb-3" />
              <CohortCardGrid cohorts={live} />
            </section>
          ) : null}
          {test.length > 0 ? (
            <section>
              <SectionHead title="Test cohorts" subtitle={`${test.length} test`} className="mb-3" />
              <CohortCardGrid cohorts={test} />
            </section>
          ) : null}
        </div>
      )}
    </CrmPageLayout>
  );
}
