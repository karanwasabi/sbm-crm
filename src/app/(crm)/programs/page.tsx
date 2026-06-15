import { ProgramsView } from '@/components/views/programs-view';
import { getProgramCalendar, getProgramCohorts, listPrograms } from '@/utils/api';

export default async function ProgramsPage() {
  let cohorts: Awaited<ReturnType<typeof getProgramCohorts>> = [];
  let calendar = { month: 'July 2026', days: [] as Awaited<ReturnType<typeof getProgramCalendar>>['days'] };

  try {
    const programs = await listPrograms();
    const takeControl = programs.find((p) => p.slug === 'take-control') ?? programs[0];
    if (takeControl) {
      [cohorts, calendar] = await Promise.all([getProgramCohorts(takeControl.id), getProgramCalendar('2026-07')]);
    }
  } catch {
    cohorts = [];
  }

  return <ProgramsView cohorts={cohorts} calendarMonth={calendar.month} calendarDays={calendar.days} />;
}
