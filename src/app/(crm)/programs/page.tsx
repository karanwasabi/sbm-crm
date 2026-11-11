import { ProgramsView } from '@/components/views/programs-view';
import { getProgramCohorts, listPrograms } from '@/utils/api';
import type { CohortSummary } from '@/types/crm';

export default async function ProgramsPage() {
  let cohorts: CohortSummary[] = [];

  try {
    const programs = await listPrograms();
    const wanted = ['take-control', 'take-control-trial']
      .map((slug) => {
        const program = programs.find((item) => item.slug === slug);
        return program ? { id: program.id, slug: program.slug } : null;
      })
      .filter((item): item is { id: string; slug: string } => Boolean(item));
    const lists = await Promise.all(
      wanted.map(async ({ id, slug }) => {
        const rows = await getProgramCohorts(id);
        return rows.map((cohort) => ({ ...cohort, programSlug: slug }));
      })
    );
    cohorts = lists.flat();
  } catch {
    cohorts = [];
  }

  return <ProgramsView cohorts={cohorts} />;
}
