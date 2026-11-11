type PhasePillTone = 'neutral' | 'brand' | 'success' | 'warn' | 'danger' | 'deep' | 'paid' | 'organic' | 'offline';

export const TAKE_CONTROL_TRIAL_PROGRAM_SLUG = 'take-control-trial';

export function isFutureCohort(cohort: { status?: string }): boolean {
  return cohort.status === 'upcoming' || cohort.status === 'queued';
}

/** Running live batches, plus pipeline (upcoming/queued). Not test or trial. */
export function isLiveCohort(cohort: {
  isLive?: boolean;
  status?: string;
  programSlug?: string;
  isDemo?: boolean;
}): boolean {
  if (cohort.isDemo || cohort.programSlug === TAKE_CONTROL_TRIAL_PROGRAM_SLUG) return false;
  return isFutureCohort(cohort) || Boolean(cohort.isLive);
}

export function isTrialProgramCohort(cohort: { programSlug?: string; isDemo?: boolean }): boolean {
  return !cohort.isDemo && cohort.programSlug === TAKE_CONTROL_TRIAL_PROGRAM_SLUG;
}

function compareStartsOnDesc(a: { startsOn: string }, b: { startsOn: string }): number {
  return b.startsOn.localeCompare(a.startsOn);
}

function compareStartsOnAsc(a: { startsOn: string }, b: { startsOn: string }): number {
  return a.startsOn.localeCompare(b.startsOn);
}

export function compareCohortsLiveFirst(
  a: { startsOn: string; isLive?: boolean; status?: string; programSlug?: string; isDemo?: boolean },
  b: { startsOn: string; isLive?: boolean; status?: string; programSlug?: string; isDemo?: boolean }
): number {
  const liveDiff = Number(isLiveCohort(b)) - Number(isLiveCohort(a));
  if (liveDiff !== 0) return liveDiff;
  return compareStartsOnDesc(a, b);
}

export function sortCohorts<
  T extends { startsOn: string; isLive?: boolean; status?: string; programSlug?: string; isDemo?: boolean },
>(cohorts: T[]): T[] {
  return [...cohorts].sort(compareCohortsLiveFirst);
}

export function partitionProgramCohorts<
  T extends { startsOn: string; isLive?: boolean; status?: string; isDemo?: boolean; programSlug?: string },
>(cohorts: T[]): { live: T[]; futureUpcoming: T[]; futureQueued: T[]; trial: T[]; test: T[] } {
  const live: T[] = [];
  const futureUpcoming: T[] = [];
  const futureQueued: T[] = [];
  const trial: T[] = [];
  const test: T[] = [];

  for (const cohort of cohorts) {
    if (cohort.isDemo) {
      test.push(cohort);
      continue;
    }
    if (cohort.programSlug === TAKE_CONTROL_TRIAL_PROGRAM_SLUG) {
      trial.push(cohort);
      continue;
    }
    if (cohort.status === 'upcoming') {
      futureUpcoming.push(cohort);
      continue;
    }
    if (cohort.status === 'queued') {
      futureQueued.push(cohort);
      continue;
    }
    if (Boolean(cohort.isLive)) {
      live.push(cohort);
      continue;
    }
    test.push(cohort);
  }

  live.sort(compareStartsOnDesc);
  futureUpcoming.sort(compareStartsOnAsc);
  futureQueued.sort(compareStartsOnAsc);
  trial.sort(compareStartsOnDesc);
  test.sort(compareStartsOnDesc);

  return { live, futureUpcoming, futureQueued, trial, test };
}

export function partitionCohorts<
  T extends { startsOn: string; isLive?: boolean; status?: string; isDemo?: boolean; programSlug?: string },
>(cohorts: T[]): { live: T[]; future: T[]; trial: T[]; test: T[] } {
  const { live, futureUpcoming, futureQueued, trial, test } = partitionProgramCohorts(cohorts);
  return {
    live,
    future: [...futureUpcoming, ...futureQueued],
    trial,
    test,
  };
}

export function firstLiveCohortId<
  T extends { id: string; isLive?: boolean; status?: string; startsOn: string; isDemo?: boolean; programSlug?: string },
>(cohorts: T[]): string {
  const { live, future, trial, test } = partitionCohorts(cohorts);
  return live[0]?.id ?? future[0]?.id ?? trial[0]?.id ?? test[0]?.id ?? '';
}

export function formatCohortStartDate(startsOn: string): string {
  const parsed = new Date(`${startsOn}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return startsOn;
  return parsed.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatCohortStartDateCard(startsOn: string): string {
  const parsed = new Date(`${startsOn}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return startsOn;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatCohortStartDateLong(startsOn: string): string {
  return formatCohortStartDateCard(startsOn);
}

/** Matches backend cohortPointAEffective UTC calendar comparison. */
export function cohortStartDateReached(startsOn: string, now = new Date()): boolean {
  const parsed = new Date(`${startsOn}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return parsed.getTime() <= todayUTC;
}

export function phasePillTone(phaseLabel: string): PhasePillTone {
  switch (phaseLabel) {
    case 'Queued':
      return 'deep';
    case 'Upcoming':
      return 'brand';
    case 'Locked':
      return 'warn';
    case 'Initial 3-month phase':
      return 'warn';
    case 'Monthly phase':
      return 'success';
    case 'Inactive':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function cohortCardSurface(status: string): string {
  switch (status) {
    case 'queued':
      return 'relative overflow-hidden border-[#C4B5FD] bg-linear-to-br from-[#FAF5FF] via-[#F3E8FF] to-[#EDE9FE] hover:border-[#A78BFA] hover:shadow-[0_10px_28px_-14px_rgba(124,58,237,0.45)]';
    case 'upcoming':
      return 'relative overflow-hidden border-brand/40 bg-linear-to-br from-[#F5F7FF] via-[#EEF0FF] to-[#E0E7FF] hover:border-brand/60 hover:shadow-[0_10px_28px_-14px_rgba(92,101,207,0.38)]';
    case 'locked':
      return 'relative overflow-hidden border-amber-300 bg-linear-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] hover:border-amber-400 hover:shadow-[0_10px_28px_-14px_rgba(217,119,6,0.35)]';
    case 'inactive':
      return 'border-slate-100 bg-linear-to-br from-slate-50 to-slate-100/80 opacity-70 hover:opacity-85';
    default:
      return 'border-slate-100 bg-white hover:border-brand/30 hover:shadow-sm';
  }
}

export function cohortCardGlow(status: string): string | null {
  switch (status) {
    case 'queued':
      return 'bg-[#A78BFA]/35';
    case 'upcoming':
      return 'bg-brand/30';
    case 'locked':
      return 'bg-amber-400/35';
    default:
      return null;
  }
}

export function cohortHeaderAccent(status: string): string {
  switch (status) {
    case 'queued':
      return 'border-[#7C3AED] from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9]';
    case 'upcoming':
      return 'border-brand-press from-brand via-[#6A71E6] to-brand-press';
    case 'locked':
      return 'border-amber-600 from-amber-500 via-amber-600 to-amber-700';
    case 'inactive':
      return 'border-slate-400 from-slate-500 via-slate-500 to-slate-600';
    default:
      return 'border-brand-press from-brand via-[#6A71E6] to-brand-press';
  }
}

export function cohortCardHref(cohortId: string): string {
  return `/programs/cohorts/${cohortId}`;
}

export function isInactiveCohort(status: string): boolean {
  return status === 'inactive';
}
