import { ProgramsView } from '@/components/views/programs-view';
import { getProgramCohorts, listPrograms } from '@/utils/api';

export default async function ProgramsPage() {
  let cohorts: Awaited<ReturnType<typeof getProgramCohorts>> = [];

  try {
    const programs = await listPrograms();
    const programIds = ['take-control', 'take-control-trial']
      .map((slug) => programs.find((program) => program.slug === slug)?.id)
      .filter((id): id is string => Boolean(id));
    const lists = await Promise.all(programIds.map((id) => getProgramCohorts(id)));
    cohorts = lists.flat();
  } catch {
    cohorts = [];
  }

  return <ProgramsView cohorts={cohorts} />;
}
