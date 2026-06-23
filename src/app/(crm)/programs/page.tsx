import { ProgramsView } from '@/components/views/programs-view';
import { getProgramCohorts, listPrograms } from '@/utils/api';

export default async function ProgramsPage() {
  let programName = 'Take Control';
  let cohorts: Awaited<ReturnType<typeof getProgramCohorts>> = [];

  try {
    const programs = await listPrograms();
    const takeControl = programs.find((p) => p.slug === 'take-control') ?? programs[0];
    if (takeControl) {
      programName = takeControl.name;
      cohorts = await getProgramCohorts(takeControl.id);
    }
  } catch {
    cohorts = [];
  }

  return <ProgramsView programName={programName} cohorts={cohorts} />;
}
